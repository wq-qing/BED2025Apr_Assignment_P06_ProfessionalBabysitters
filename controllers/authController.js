const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbConfig = require("../dbConfig");

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("Email", sql.VarChar(100), email)
      .query("SELECT * FROM Users WHERE Email = @Email");

    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.Password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.Id, role: user.Role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "2h" }
    );

    delete user.Password; // Don't expose password hash
    res.json({ message: "Login successful", token, user });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { login };
