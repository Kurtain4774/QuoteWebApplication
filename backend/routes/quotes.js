const express = require('express');
const Quote = require('../models/Quote');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/quotes — browse all quotes, optional ?q=keyword &tag=x &author=x
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, tag, author } = req.query;
    const filter = {};

    if (tag) filter.tags = tag.toLowerCase();
    if (author) filter.author = { $regex: author, $options: 'i' };
    if (q) filter.$or = [
      { text:   { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
      { tags:   { $regex: q, $options: 'i' } },
    ];

    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username')
      .lean();

    // Attach isSaved flag for the requesting user
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
    if (quote.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not your quote' });
    }

    await quote.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
