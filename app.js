// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const cron = require("node-cron");

// Reminder MVC
const {
  listReminders,
  addReminder,
  editReminder,
  removeReminder,
} = require("./practical-api-mvc-db/controllers/reminderController");
const validateReminder = require("./practical-api-mvc-db/middleware/validateReminder");
const errorHandler = require("./practical-api-mvc-db/middleware/reminderErrorHandler");

// Other controllers
const walletController = require("./practical-api-mvc-db/controllers/walletController");
const paymentController = require("./practical-api-mvc-db/controllers/paymentController");
const notificationsController = require("./practical-api-mvc-db/controllers/notificationsController");

// Mongo models needed for low-balance cron
const Wallet = require("./practical-api-mvc-db/models/walletModels");

// DB config
const dbConfig = require("./dbConfig");

const app = express(); // <-- define app before using it
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Static/html routes
app.get("/reminder", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "reminder.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "jayden", "html", "index.html"));
});
app.get("/elderlyUserHome", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "elderlyUserHome.html"));
});
app.get("/waitingRooms", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "waitingRooms.html"));
});
app.get("/calendar", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "calendar.html"));
});
app.get("/wallet", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "wallet.html"));
});
app.get("/notifications", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "notifications.html"));
});

// Connect to databases and mount routes
sql.connect(dbConfig)
  .then(async () => {
    console.log("MSSQL Connected");

    // Connect to MongoDB (walletApp)
    try {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
    } catch (mongoErr) {
      console.error("❌ MongoDB connection failed:", mongoErr);
    }

    // Reminder CRUD
    app.get("/api/reminders", listReminders);
    app.post("/api/reminders", validateReminder, addReminder);
    app.put("/api/reminders/:id", validateReminder, editReminder);
    app.delete("/api/reminders/:id", removeReminder);

    const appointmentController = require("./practical-api-mvc-db/controllers/appointmentController");

    // Calendar appointment CRUD
    app.post("/api/appointments", appointmentController.create);
    app.get("/api/appointments", appointmentController.read);
    app.put("/api/appointments/:id", appointmentController.update);
    app.delete("/api/appointments/:id", appointmentController.delete);

    // Notifications / wallet / payment
    app.get("/elderlyUserHome/notifications", notificationsController.getNotifications);
    app.post("/mark-read", notificationsController.markAsRead);
    app.post("/pay", paymentController.postPayment);
    app.get("/elderlyUserHome/wallet", walletController.serveWalletPage);
    app.get("/balance", walletController.getBalance);
    app.post("/topup", walletController.postTopUp);
    app.get("/transactions", walletController.getTransactions);
    app.get("/last-card", walletController.getLastCard);

    // Cron job: low balance notifications
    cron.schedule("*/5 * * * *", async () => {
      try {
        // Find wallets with balance < 50 that haven't been notified
        const lowWallets = await Wallet.find({
          balance: { $lt: 50 },
          lowBalanceNotified: false,
        });

        for (const w of lowWallets) {
          const msg = `Your wallet balance is low ($${w.balance.toFixed(2)}). Please top up soon.`;
          // Insert into MSSQL Notifications table
          await new sql.Request()
            .input("userId", sql.VarChar, w.userId)
            .input("message", sql.NVarChar, msg)
            .query("INSERT INTO Notifications (userId, message) VALUES (@userId, @message)");

          // Mark wallet as notified
          w.lowBalanceNotified = true;
          await w.save();

          console.log(`✅ Low-balance notification sent to ${w.userId}: "${msg}"`);
        }
      } catch (err) {
        console.error("Error sending low-balance notifications:", err);
      }
    });

    // Error handler (after all routes)
    app.use(errorHandler);

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is shutting down");
  try {
    await sql.close();
    console.log("Database connections closed");
  } catch (e) {
    console.error("Error closing DB connection:", e);
  }
  process.exit(0);
});
