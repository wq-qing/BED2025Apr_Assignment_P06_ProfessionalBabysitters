//Jayden

const userModel = require("../../models/userModel.js");

async function registerUser(req, res) {
  try {
    const { Id, Name, Email, Password, Role } = req.body;

    if (!Id || !Name || !Email || !Password || !Role) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ Map to expected keys for the model
    const result = await userModel.registerUser({
      userId: Id,
      fullName: Name,
      email: Email,
      password: Password,
      role: Role
    });

    if (result.success) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("❌ Controller error in registerUser:", error);
    res.status(500).json({ error: "Error registering user" });
  }
}

module.exports = {
  registerUser
};