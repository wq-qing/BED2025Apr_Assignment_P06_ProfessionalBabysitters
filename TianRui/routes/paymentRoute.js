const express = require("express");
const router = express.Router();
const Wallet = require("../models/walletModels");
const Transaction = require("../models/transactionModels"); // ✅ Add this line

// POST /payment/pay
router.post("/pay", async (req, res) => {
  console.log("🟢 /payment/pay route hit");

  const { userId, amount } = req.body;
  console.log("🔍 Payload:", { userId, amount });

  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      console.log("❌ Wallet not found");
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    if (wallet.balance < parseFloat(amount)) {
      console.log("❌ Insufficient balance");
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    wallet.balance -= parseFloat(amount);
    await wallet.save();

    // ✅ Log transaction to database
    await Transaction.create({
      userId,
      type: "payment",
      amount: parseFloat(amount),
      cardLast4: "WALLET", // 'WALLET' means paid using balance
      timestamp: new Date(),
    });

    console.log("✅ Payment success. New balance:", wallet.balance);

    res.json({
      success: true,
      message: "Payment successful",
      remainingBalance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Payment error:", err);
    res.status(500).json({ success: false, message: "Payment failed", error: err.message });
  }
});

module.exports = router;
