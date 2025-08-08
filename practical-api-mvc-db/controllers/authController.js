// practical-api-mvc-db/controllers/authController.js
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

module.exports = {
  async login(req, res) {
    const { userId, password } = req.body; // adapt field names to your frontend
    try {
      // Fetch user by Id or email depending on your logic; here using Id
      const pool = await require("../../dbConfig"); // or use sql.connect pattern
      const sqlLib = require("mssql");
      const connection = await sqlLib.connect(require("../../dbConfig"));
      const result = await connection
        .request()
        .input("Id", sqlLib.VarChar, userId)
        .query("SELECT Id, Name, Email, Password FROM Users WHERE Id = @Id");

      const user = result.recordset[0];
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.Password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { userId: user.Id, username: user.Name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token });
    } catch (err) {
      console.error("❌ login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};
