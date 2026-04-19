// Seeds the Quote collection with a curated set of famous quotes.
// Idempotent: matches on { source: 'famous', text, author } and uses $setOnInsert,
// so re-running the script will not duplicate existing entries.
//
// Usage: npm run seed:famous  (from the backend/ directory)

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

const Quote = require('../models/Quote');
const famousQuotes = require('./famousQuotes.data');

// Match server.js DNS config so SRV resolution works against Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB');

  let inserted = 0;
  let skipped = 0;

  for (const quote of famousQuotes) {
    const res = await Quote.updateOne(
      { source: 'famous', text: quote.text, author: quote.author },
      {
        $setOnInsert: {
          text: quote.text,
          author: quote.author,
          tags: quote.tags || [],
          source: 'famous',
        },
      },
      { upsert: true }
    );

    if (res.upsertedCount && res.upsertedCount > 0) inserted += 1;
    else skipped += 1;
  }

  console.log(`Done. inserted=${inserted}, skipped=${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
