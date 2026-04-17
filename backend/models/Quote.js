const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    author:    { type: String, trim: true, default: '' },
    tags:      [{ type: String, lowercase: true, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    savedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', quoteSchema);
