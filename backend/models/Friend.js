const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    from:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  },
  { timestamps: true }
);

// Prevent duplicate requests in both directions
friendSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
