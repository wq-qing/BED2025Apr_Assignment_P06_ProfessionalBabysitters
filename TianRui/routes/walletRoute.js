// routes/walletRoute.js
const express = require("express");
const router = express.Router();
const wc = require("../controllers/walletController");  // ← your wallet controller

// Serve the Wallet page
router.get("/elderlyUserHome", wc.serveWalletPage);

// API endpoints
router.get("/balance", wc.getBalance);
router.post("/topup", wc.postTopUp);
router.get("/transactions", wc.getTransactions);
router.get("/last-card", wc.getLastCard);

module.exports = router;
