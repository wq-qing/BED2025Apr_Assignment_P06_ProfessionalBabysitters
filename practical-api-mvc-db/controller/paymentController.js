// controllers/paymentController.js
const Wallet = require("../model/walletModels");
const Transaction = require("../model/transactionModels");

module.exports = {
  // POST /payment/pay
  async postPayment(req, res) {
    console.log("/payment/pay route hit");
    const { userId, amount } = req.body;
    console.log("Payload:", { userId, amount });

    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        console.log("Wallet not found");
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }

      if (wallet.balance < parseFloat(amount)) {
        console.log("Insufficient balance");
        return res.status(400).json({ success: false, message: "Insufficient balance" });
      }

      // Deduct balance
      wallet.balance -= parseFloat(amount);

      // Record embedded withdraw transaction
      wallet.transactions.push({
        type: "withdraw",
        amount: parseFloat(amount),
        // date defaults to now
      });

      await wallet.save();

      // Optional: also log to separate Transactions collection for audit
      await Transaction.create({
        userId,
        type: "payment", // external/audit nomenclature
        amount: parseFloat(amount),
        cardLast4: "WALLET",
        timestamp: new Date(),
      });

      console.log("Payment success. New balance:", wallet.balance);

      res.json({
        success: true,
        message: "Payment successful",
        remainingBalance: wallet.balance,
      });
    } catch (err) {
      console.error("Payment error:", err);
      res.status(500).json({ success: false, message: "Payment failed", error: err.message });
    }
  }
};
