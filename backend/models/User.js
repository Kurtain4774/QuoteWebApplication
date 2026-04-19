const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    preferences: {
      theme:      { type: String, enum: ['light', 'dark', 'custom'], default: 'light' },
      customBg:   { type: String, default: '#ffffff' },
      customText: { type: String, default: '#111827' },
      fontSize:   { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
