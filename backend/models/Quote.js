const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    author:    { type: String, trim: true, default: '' },
    tags:      [{ type: String, lowercase: true, trim: true }],
    // 'community' = user-created, 'famous' = seeded from notable figures
    source:    { type: String, enum: ['community', 'famous'], default: 'community', index: true },
    // Required only for community quotes — famous quotes have no creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () { return this.source === 'community'; },
    },
    savedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound index for cursor pagination within a source mode
quoteSchema.index({ source: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('Quote', quoteSchema);
