// practical-api-mvc-db/controllers/profileController.js
const userModel = require("../models/userModel");

module.exports = {
  async getProfile(req, res) {
    try {
      const profile = await userModel.getProfileById(req.user.userId);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        Name: profile.name,
        Username: profile.username,
        Email: profile.email,
        Role: profile.role,
      });
    } catch (err) {
      console.error("❌ profileController.getProfile error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};
