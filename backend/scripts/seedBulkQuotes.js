// Seeds the Quote collection with quotes fetched from https://dummyjson.com/quotes
// (~1,454 quotes). Originally written against type.fit, but that API has degraded
// to ~5 quotes total — DummyJSON is the working replacement.
//
// Idempotent: deletes ALL quotes from the collection before inserting, so re-runs
// produce the same final state.
//
// WARNING: deleteMany({}) wipes user-created community quotes too. Only safe
// while the DB has no real user data. If real users exist, switch to
// deleteMany({ source: 'famous' }) below.
//
// Requires Node 18+ for native fetch.
//
// Usage: npm run seed:bulk  (from the backend/ directory)

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

const Quote = require('../models/Quote');
const { tagify } = require('./tagging');

// limit=0 returns all quotes in a single response.
const SOURCE_URL = 'https://dummyjson.com/quotes?limit=0';

// Match server.js DNS config so SRV resolution works against Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function fetchQuotes() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // DummyJSON shape: { quotes: [{ id, quote, author }], total, ... }
  if (!data || !Array.isArray(data.quotes)) {
    throw new Error(`Unexpected response shape from ${SOURCE_URL}`);
  }
  return data.quotes;
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB');

  const raw = await fetchQuotes();
  console.log(`fetched=${raw.length}`);

  // Map + dedupe in memory: collapses duplicate (text, author) pairs inside
  // the API payload itself.
  const seen = new Set();
  const docs = [];
  for (const item of raw) {
    const text = String(item?.quote || '').trim();
    if (!text) continue;
    const author = String(item?.author || '').trim();
    const key = `${text}\u0000${author}`;
    if (seen.has(key)) continue;
    seen.add(key);
    docs.push({
      text,
      author,
      tags: tagify(text, author),
      source: 'famous',
    });
  }
  console.log(`afterDedupe=${docs.length}`);

  const delRes = await Quote.deleteMany({});
  console.log(`deleted=${delRes.deletedCount}`);

  // ordered: false so one validation failure doesn't abort the rest of the batch.
  let inserted = 0;
  try {
    await Quote.insertMany(docs, { ordered: false });
    inserted = docs.length;
  } catch (err) {
    const errCount = err?.writeErrors?.length ?? err?.result?.writeErrors?.length ?? 0;
    inserted = docs.length - errCount;
    console.warn(`Some inserts failed. errors=${errCount}`);
  }
  console.log(`inserted=${inserted}`);

  const finalCount = await Quote.countDocuments();
  console.log(`finalCount=${finalCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
