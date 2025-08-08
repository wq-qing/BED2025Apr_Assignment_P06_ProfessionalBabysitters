const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqlLib = require("mssql");
const dbConfig = require("../../dbConfig");

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const pool = await sqlLib.connect(dbConfig);
      const result = await pool
        .request()
        .input("Email", sqlLib.VarChar, email)
        .query("SELECT Id, Name, Email, Password FROM Users WHERE Email = @Email");

      const user = result.recordset[0];
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.Password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { userId: user.Id, username: user.Name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: {
    userId: user.Id,  // <== this must match what the frontend uses
    Name: user.Name,
    Email: user.Email
  } }); // send user object back if needed
    } catch (err) {
      console.error("❌ login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};
