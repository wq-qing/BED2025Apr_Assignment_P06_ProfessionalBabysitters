const express = require("express");
const router = express.Router();
const path = require("path");
const Wallet = require("../models/walletModels");
const CreditCard = require("../models/creditCardModels");
const Transaction = require("../models/transactionModels");

// GET wallet balance
router.get("/balance", async (req, res) => {
  const { userId } = req.query;

  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ balance: 0, message: "Wallet not found" });
    }
    res.json({ balance: wallet.balance });
  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// POST wallet top-up
router.post("/topup", async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv, amount } = req.body;

  try {
    let card = await CreditCard.findOne({ userId, cardNumber });

    if (!card) {
      card = new CreditCard({ userId, cardNumber, expiryDate, cvv });
      await card.save();
    }

    // Card simulation
    if (cardNumber === "9999888877776666") {
      return res.status(400).json({ error: "Invalid card. Please use a valid card." });
    }
    if (cardNumber === "5555666677778888") {
      return res.status(400).json({ error: "Card declined due to insufficient funds." });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId, balance: 0 });

    wallet.balance += parseFloat(amount);
    await wallet.save();

    // Save transaction
    await Transaction.create({
      userId,
      type: "top-up",
      amount: parseFloat(amount),
      cardLast4: cardNumber.slice(-4),
      timestamp: new Date()
    });

    res.json({ success: true, newBalance: wallet.balance });
  } catch (err) {
    console.error("Top-up error:", err);
    res.status(500).json({ error: "Top-up failed" });
  }
});

// GET last 5 transactions (NEW SORT BY TIMESTAMP)
router.get("/transactions", async (req, res) => {
  const { userId } = req.query;

  try {
    const history = await Transaction.find({ userId }).sort({ timestamp: -1 }).limit(5);
    res.json(history);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET last used card
router.get("/last-card", async (req, res) => {
  const { userId } = req.query;

  try {
    const lastCard = await CreditCard.findOne({ userId }).sort({ _id: -1 });
    if (!lastCard) return res.status(404).json({ error: "No card found." });

    res.json({
      cardNumber: lastCard.cardNumber,
      expiryDate: lastCard.expiryDate,
      cvv: lastCard.cvv,
    });
  } catch (err) {
    console.error("Last card error:", err);
    res.status(500).json({ error: "Error fetching last card." });
  }
});

// Serve frontend
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/wallet.html"));
});

module.exports = router;
