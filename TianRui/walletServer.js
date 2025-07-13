const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const walletRoute = require("./routes/walletRoute");
const paymentRoute = require("./routes/paymentRoute");
console.log("walletServer.js started");


const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/wallet", walletRoute);
app.use("/payment", paymentRoute);

console.log("Routes registered");

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});


