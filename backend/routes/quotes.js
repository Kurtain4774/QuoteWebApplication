const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const Quote = require('../models/Quote');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const objectIdSchema = z.string().refine(
  (v) => mongoose.Types.ObjectId.isValid(v),
  'Invalid id'
);

const createQuoteSchema = z.object({
  text:   z.string().trim().min(1, 'Quote text is required').max(2000),
  author: z.string().trim().max(200).optional().default(''),
  tags:   z.array(z.string().trim().toLowerCase().max(50)).max(20).optional().default([]),
});

const idParamsSchema = z.object({ id: objectIdSchema });

// GET /api/quotes — browse quotes with cursor pagination
router.get('/', requireAuth, async (req, res) => {
  const { q, tag, author, source, cursor } = req.query;

  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const filter = {};

  if (source === 'community' || source === 'famous') filter.source = source;
  if (typeof tag === 'string')    filter.tags   = tag.toLowerCase();
  if (typeof author === 'string') filter.author = { $regex: escapeRegex(author), $options: 'i' };
  if (typeof q === 'string') filter.$or = [
    { text:   { $regex: escapeRegex(q), $options: 'i' } },
    { author: { $regex: escapeRegex(q), $options: 'i' } },
    { tags:   { $regex: escapeRegex(q), $options: 'i' } },
  ];

  // Decode cursor: "<ISO-date>_<objectId>" base64-encoded
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const sepIdx = decoded.lastIndexOf('_');
      if (sepIdx === -1) throw new Error('Bad cursor');
      const cursorDate = new Date(decoded.slice(0, sepIdx));
      const cursorId = new mongoose.Types.ObjectId(decoded.slice(sepIdx + 1));
      if (isNaN(cursorDate.getTime())) throw new Error('Bad cursor date');

      const cursorClause = {
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, cursorClause];
        delete filter.$or;
      } else {
        Object.assign(filter, cursorClause);
      }
    } catch {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
  }

  const docs = await Quote.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('createdBy', 'username')
    .lean();

  let nextCursor = null;
  if (docs.length > limit) {
    docs.pop();
    const last = docs[docs.length - 1];
    const raw = `${last.createdAt.toISOString()}_${last._id.toString()}`;
    nextCursor = Buffer.from(raw, 'utf8').toString('base64');
  }

  const userId = req.userId.toString();
  const items = docs.map((doc) => ({
    ...doc,
    isSaved: doc.savedBy.some((id) => id.toString() === userId),
    savedCount: doc.savedBy.length,
  }));

  res.json({ items, nextCursor });
});

// GET /api/quotes/mine
router.get('/mine', requireAuth, async (req, res) => {
  const quotes = await Quote.find({ createdBy: req.userId })
    .sort({ createdAt: -1 })
    .lean();

  const userId = req.userId.toString();
  const result = quotes.map((q) => ({
    ...q,
    isSaved: q.savedBy.some((id) => id.toString() === userId),
    savedCount: q.savedBy.length,
  }));

  res.json(result);
});

// GET /api/quotes/saved
router.get('/saved', requireAuth, async (req, res) => {
  const quotes = await Quote.find({ savedBy: req.userId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username')
    .lean();

  const result = quotes.map((q) => ({ ...q, isSaved: true, savedCount: q.savedBy.length }));
  res.json(result);
});

// POST /api/quotes — create a quote
router.post('/', requireAuth, validate({ body: createQuoteSchema }), async (req, res) => {
  const { text, author, tags } = req.body;
  const quote = await Quote.create({ text, author, tags, createdBy: req.userId });
  res.status(201).json(quote);
});

// POST /api/quotes/:id/save — toggle save/unsave
router.post('/:id/save', requireAuth, validate({ params: idParamsSchema }), async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const userId = req.userId.toString();
  const alreadySaved = quote.savedBy.some((id) => id.toString() === userId);

  if (alreadySaved) {
    quote.savedBy = quote.savedBy.filter((id) => id.toString() !== userId);
  } else {
    quote.savedBy.push(req.userId);
  }

  await quote.save();
  res.json({ isSaved: !alreadySaved, savedCount: quote.savedBy.length });
});

// DELETE /api/quotes/:id — delete own quote
router.delete('/:id', requireAuth, validate({ params: idParamsSchema }), async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  if (!quote.createdBy || quote.createdBy.toString() !== req.userId.toString()) {
    return res.status(403).json({ error: 'Not your quote' });
  }

  await quote.deleteOne();
  res.json({ success: true });
});

// Escape regex special chars — prevents ReDoS and regex injection from user input
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
