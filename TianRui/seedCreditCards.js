const mongoose = require("mongoose");
const CreditCard = require("./models/creditCardModels");

mongoose.connect("mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const seedCards = async () => {
  await CreditCard.deleteMany({});
  await CreditCard.create([
    {
      userId: "user123",
      cardNumber: "1111222233334444", // Valid
      expiryDate: "12/25",
      cvv: "123"
    },
    {
      userId: "user123",
      cardNumber: "5555666677778888", // Valid but pretend it has low balance
      expiryDate: "11/24",
      cvv: "456"
    },
    {
      userId: "user123",
      cardNumber: "9999888877776666", // Invalid card
      expiryDate: "01/20",
      cvv: "000"
    }
  ]);
  console.log("Test credit cards seeded.");
  mongoose.disconnect();
};

seedCards();


