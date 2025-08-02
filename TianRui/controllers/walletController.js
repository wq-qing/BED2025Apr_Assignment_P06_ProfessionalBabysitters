// controllers/walletController.js
const path = require("path");
const Wallet = require("../models/walletModels");
const CreditCard = require("../models/creditCardModels");

module.exports = {
  // Serve the wallet HTML page
  serveWalletPage(req, res) {
    res.sendFile(path.join(__dirname, "../public/wallet.html"));
  },

  // GET /wallet/balance?userId=...
  async getBalance(req, res) {
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
  },

  // POST /wallet/topup
  async postTopUp(req, res) {
    const { userId, cardNumber, expiryDate, cvv, amount } = req.body;
    try {
      // 1) Save or update card and bump lastUsed
      let card = await CreditCard.findOne({ userId, cardNumber });
      if (!card) {
        card = new CreditCard({
          userId,
          cardNumber,
          expiryDate,
          cvv,
          lastUsed: new Date(),
        });
      } else {
        card.expiryDate = expiryDate;
        card.cvv = cvv;
        card.lastUsed = new Date();
      }
      await card.save();

      // 2) Simulated failures
      if (cardNumber === "9999888877776666") {
        return res.status(400).json({ error: "Invalid card. Please use a valid card." });
      }
      if (cardNumber === "5555666677778888") {
        return res.status(400).json({ error: "Card declined due to insufficient funds." });
      }

      // 3) Update or create wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0 });
      }

      wallet.balance += parseFloat(amount);

      // if balance is now >= 50, reset lowBalanceNotified so future dips can re-notify
      if (wallet.balance >= 50 && wallet.lowBalanceNotified) {
        wallet.lowBalanceNotified = false;
      }

      // 4) Record embedded transaction as a deposit
      wallet.transactions.push({
        type: "deposit",
        amount: parseFloat(amount),
        // date defaults to now
      });

      await wallet.save();

      res.json({ success: true, newBalance: wallet.balance });
    } catch (err) {
      console.error("Top-up error:", err);
      res.status(500).json({ error: "Top-up failed" });
    }
  },

  // GET /wallet/transactions?userId=...
  async getTransactions(req, res) {
    const { userId } = req.query;
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // sort embedded transactions by date desc and return last 5
      const recent = (wallet.transactions || [])
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);

      // normalize to a consistent shape if needed
      res.json(recent);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  },

  // GET /wallet/last-card?userId=...
  async getLastCard(req, res) {
    const { userId } = req.query;
    try {
      const lastCard = await CreditCard.findOne({ userId }).sort({ lastUsed: -1 });
      if (!lastCard) {
        return res.status(404).json({ error: "No card found." });
      }
      res.json({
        cardNumber: lastCard.cardNumber,
        expiryDate: lastCard.expiryDate,
        cvv: lastCard.cvv,
      });
    } catch (err) {
      console.error("Last card error:", err);
      res.status(500).json({ error: "Error fetching last card." });
    }
  },
};
