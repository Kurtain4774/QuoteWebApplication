const express = require('express');
const Quote = require('../models/Quote');
const User = require('../models/User');

const router = express.Router();

// Public aggregate stats for the homepage counters.
// Cached in-process for 60s so scroll-triggered counters don't hammer the DB.
let cache = { data: null, expires: 0 };
let trendingCache = { data: null, expires: 0 };
const TTL_MS = 60 * 1000;

router.get('/', async (req, res) => {
  if (cache.data && Date.now() < cache.expires) {
    return res.json(cache.data);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [quotes, users, authors, tags, savesAgg, recent] = await Promise.all([
    Quote.countDocuments(),
    User.countDocuments(),
    Quote.distinct('author', { author: { $ne: '' } }),
    Quote.distinct('tags'),
    Quote.aggregate([
      { $project: { count: { $size: { $ifNull: ['$savedBy', []] } } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]),
    Quote.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  const data = {
    quotes,
    users,
    authors: authors.length,
    tags: tags.length,
    saves: savesAgg[0]?.total || 0,
    quotesThisWeek: recent,
  };

  cache = { data, expires: Date.now() + TTL_MS };
  res.json(data);
});

// Public endpoint: top 5 most-bookmarked quotes for the homepage Trending section.
router.get('/trending', async (req, res) => {
  if (trendingCache.data && Date.now() < trendingCache.expires) {
    return res.json(trendingCache.data);
  }

  const quotes = await Quote.aggregate([
    { $project: {
        text: 1,
        author: 1,
        tags: 1,
        saveCount: { $size: { $ifNull: ['$savedBy', []] } },
    }},
    { $sort: { saveCount: -1 } },
    { $limit: 5 },
  ]);

  trendingCache = { data: quotes, expires: Date.now() + TTL_MS };
  res.json(quotes);
});

module.exports = router;
