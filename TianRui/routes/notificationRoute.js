const express = require("express");
const router = express.Router();
const nc = require("../controllers/notificationsController");

router.get("/elderlyUserHome", nc.getNotifications);
router.post("/mark-read", nc.markAsRead);

module.exports = router;
