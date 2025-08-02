const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ["top-up", "payment"], // ensures consistent values
    required: true,
  },
  amount: { type: Number, required: true },
  cardLast4: { type: String, required: true },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);

