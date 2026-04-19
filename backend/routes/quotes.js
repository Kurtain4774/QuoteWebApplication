const express = require('express');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/quotes — browse quotes with cursor pagination
// Query params: ?source=community|famous &q=keyword &tag=x &author=x &limit=20 &cursor=<base64>
// Response: { items: [...], nextCursor: string | null }
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, tag, author, source, cursor } = req.query;

    // Clamp limit to [1, 50], default 20
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const filter = {};

    if (source === 'community' || source === 'famous') filter.source = source;
    if (tag) filter.tags = tag.toLowerCase();
    if (author) filter.author = { $regex: author, $options: 'i' };
    if (q) filter.$or = [
      { text:   { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
      { tags:   { $regex: q, $options: 'i' } },
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

        // Items strictly "after" the cursor in (createdAt desc, _id desc) order
        const cursorClause = {
          $or: [
            { createdAt: { $lt: cursorDate } },
            { createdAt: cursorDate, _id: { $lt: cursorId } },
          ],
        };
        // Merge with existing $or (from q search) using $and
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

    // Fetch limit+1 to detect whether more pages exist
    const docs = await Quote.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('createdBy', 'username')
      .lean();

    let nextCursor = null;
    if (docs.length > limit) {
      docs.pop(); // drop the peek
      const last = docs[docs.length - 1];
      const raw = `${last.createdAt.toISOString()}_${last._id.toString()}`;
      nextCursor = Buffer.from(raw, 'utf8').toString('base64');
    }

    // Attach isSaved flag for the requesting user
    const userId = req.userId.toString();
    const items = docs.map((doc) => ({
      ...doc,
      isSaved: doc.savedBy.some((id) => id.toString() === userId),
      savedCount: doc.savedBy.length,
    }));

    res.json({ items, nextCursor });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/mine — quotes created by the user
router.get('/mine', requireAuth, async (req, res) => {
  try {
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
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/saved — quotes the user has bookmarked
router.get('/saved', requireAuth, async (req, res) => {
  try {
    const quotes = await Quote.find({ savedBy: req.userId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username')
      .lean();

    const result = quotes.map((q) => ({ ...q, isSaved: true, savedCount: q.savedBy.length }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/quotes — create a quote
router.post('/', requireAuth, async (req, res) => {
  const { text, author, tags } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Quote text is required' });

  try {
    const quote = await Quote.create({
      text: text.trim(),
      author: author?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.userId,
    });
    res.status(201).json(quote);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/quotes/:id/save — toggle save/unsave
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
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
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/quotes/:id — delete own quote
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (!quote.createdBy || quote.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not your quote' });
    }

    await quote.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
