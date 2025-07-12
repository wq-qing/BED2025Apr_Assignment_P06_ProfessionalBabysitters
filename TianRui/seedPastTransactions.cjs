const mongoose = require("mongoose");
const Transaction = require("./models/transactionModels");

mongoose.connect("mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    console.log("MongoDB connected");

    // Only clear and seed transactions
    await Transaction.deleteMany({});

    await Transaction.insertMany([
      {
        userId: "user123",
        type: "top-up",
        amount: 100,
        cardLast4: "4444",
        timestamp: new Date("2025-07-09T12:18:20.145Z"),
      },
      {
        userId: "user123",
        type: "payment",
        amount: 20,
        cardLast4: "WALLET",
        timestamp: new Date("2025-07-10T12:18:20.145Z"),
      },
      {
        userId: "user123",
        type: "top-up",
        amount: 120,
        cardLast4: "4444",
        timestamp: new Date("2025-07-11T12:18:20.145Z"),
      },
    ]);

    console.log("✅ Transactions seeded.");
  } catch (err) {
    console.error("❌ Error seeding transactions:", err);
  } finally {
    mongoose.disconnect();
  }
})();
