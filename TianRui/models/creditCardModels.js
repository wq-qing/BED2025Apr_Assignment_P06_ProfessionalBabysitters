// models/creditCardModels.js
const mongoose = require("mongoose");

const creditCardSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryDate: String,
  cvv: String,
  lastUsed: {
    type: Date,
    default: Date.now,
  },
});

// optional: ensure you don’t store duplicate card per user accidentally
creditCardSchema.index({ userId: 1, cardNumber: 1 }, { unique: true });

module.exports = mongoose.model("CreditCard", creditCardSchema);
