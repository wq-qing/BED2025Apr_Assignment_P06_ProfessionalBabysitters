const mongoose = require("mongoose");

const creditCardSchema = new mongoose.Schema({
  userId: String,
  cardNumber: String,
  expiryDate: String,
  cvv: String,
});

module.exports = mongoose.model("CreditCard", creditCardSchema);
