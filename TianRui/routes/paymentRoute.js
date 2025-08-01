// routes/paymentRoute.js
const express = require("express");
const router = express.Router();
const pc = require("../controllers/paymentController"); // ← require your payment controller

// Delegate the POST /payment/pay to the controller
router.post("/pay", pc.postPayment);

module.exports = router;
