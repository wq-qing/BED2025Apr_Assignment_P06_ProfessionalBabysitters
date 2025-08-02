const userModel = require("../models/userModel.js");

async function registerUser(req, res) {
  try {
    const { userId, fullName, email, password, role } = req.body;
    
    // Basic validation (enhanced validation should be in middleware)
    if (!userId || !fullName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await userModel.registerUser({
      userId,
      fullName,
      email,
      password,
      role
    });

    if (result.success) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Controller error in registerUser:", error);
    res.status(500).json({ error: "Error registering user" });
  }
}

module.exports = {
  registerUser
};