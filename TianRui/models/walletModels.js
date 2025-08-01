const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  lowBalanceNotified: {
    type: Boolean,
    default: false
  },
  transactions: [{
    type: { 
      type: String, 
      enum: ["deposit", "withdraw"], 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    }
  }]
});

module.exports = mongoose.model("Wallet", walletSchema);
