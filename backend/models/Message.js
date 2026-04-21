const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Conversation queries match either direction of (from,to); a compound index
// on the participants + createdAt keeps the OR-scan and sort fast as message
// volume grows.
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
