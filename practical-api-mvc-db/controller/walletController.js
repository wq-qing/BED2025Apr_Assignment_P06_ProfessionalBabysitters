// controllers/walletController.js
const path = require("path");
const Wallet = require("../model/walletModels");
const CreditCard = require("../model/creditCardModels");

function isValidCardFormat(cardNumber, expiryDate, cvv) {
  // Card number: exactly 16 digits
  if (!/^\d{16}$/.test(cardNumber)) return false;

  // CVV: exactly 3 digits
  if (!/^\d{3}$/.test(cvv)) return false;

  // Expiry: MM/YY and not in the past
  const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  let [, mmStr, yyStr] = match;
  const mm = parseInt(mmStr, 10);
  const yy = parseInt(yyStr, 10);
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const expiry = new Date(2000 + yy, mm); // first day of following month
  if (expiry <= now) return false;

  return true;
}

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
      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid top-up amount." });
      }

      // Validate card format; malformed/expired treated as invalid
      if (!isValidCardFormat(cardNumber, expiryDate, cvv)) {
        return res.status(400).json({ error: "Invalid card. Please use a valid card." });
      }

      // Simulated card behavior:
      // 1. Invalid card - do NOT save
      if (cardNumber === "5555666677778888") {
        return res.status(400).json({ error: "Invalid card. Please use a valid card." });
      }

      // 2. Valid but insufficient funds - save/update card metadata, then error
      if (cardNumber === "9999888877776666") {
        // Save or update card (so previous card logic works)
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

        return res.status(400).json({ error: "Insufficient funds." });
      }

      // 3. Only this card is accepted as valid with enough funds
      if (cardNumber !== "1111222233334444") {
        return res.status(400).json({ error: "Invalid card. Please use a valid card." });
      }

      // At this point: cardNumber === "1111222233334444"
      // Save or update card
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

      // Update or create wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0 });
      }

      wallet.balance += parseFloat(amount);

      // if balance is now >= 50, reset lowBalanceNotified so future dips can re-notify
      if (wallet.balance >= 50 && wallet.lowBalanceNotified) {
        wallet.lowBalanceNotified = false;
      }

      // Record embedded transaction as a deposit
      wallet.transactions.push({
        type: "deposit",
        amount: parseFloat(amount),
        // date defaults
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
