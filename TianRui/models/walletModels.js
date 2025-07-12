const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: String,
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['deposit', 'withdraw'] },
    amount: Number,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Wallet', walletSchema);
