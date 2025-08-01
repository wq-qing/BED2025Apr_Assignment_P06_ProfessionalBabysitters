require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const walletRoute = require("./routes/walletRoute");
const paymentRoute = require("./routes/paymentRoute");
const cron = require("node-cron");
const { poolPromise, sql } = require("./db");
const Wallet = require("./models/walletModels");
const notificationRoute = require("./routes/notificationRoute");

console.log("walletServer.js started");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection (with logging)
mongoose
  .connect(process.env.MONGO_URI || "mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/wallet", walletRoute);
app.use("/payment", paymentRoute);
app.use("/notifications", notificationRoute);

// Cron job: check low balances every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🔔 Checking for low balances...");
  try {
    const lowWallets = await Wallet.find({
      balance: { $lt: 50 },
      lowBalanceNotified: false,
    });

    const pool = await poolPromise;
    for (const w of lowWallets) {
      const msg = `Your wallet balance is low ($${w.balance.toFixed(2)}). Please top up soon.`;

      // Insert and get inserted metadata
      const insertResult = await pool
        .request()
        .input("userId", sql.VarChar, w.userId)
        .input("message", sql.NVarChar, msg)
        .query(
          `
          INSERT INTO Notifications (userId, message)
          OUTPUT inserted.id, inserted.createdAt
          VALUES (@userId, @message)
        `
        );

      const inserted = insertResult.recordset[0];
      console.log(
        `Notification sent to user=${w.userId} (id=${inserted.id}) at ${inserted.createdAt}: "${msg}"`
      );

      // Mark notified so we don’t repeat
      w.lowBalanceNotified = true;
      await w.save();
    }
  } catch (err) {
    console.error("Error sending low-balance notifications:", err);
  }
});

console.log("Routes registered");

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});


