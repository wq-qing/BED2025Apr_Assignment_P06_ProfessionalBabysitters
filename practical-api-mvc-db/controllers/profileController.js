const userModel = require("../models/userModel");

module.exports = {
  async getProfileById(req, res) {
    try {
      const userId = req.params.userID; // match :userID from the route
      const profile = await userModel.getProfileById(userId);
      if (!profile) return res.status(404).json({ error: "User not found" });

      res.json({
        userId: profile.userId,
        Name: profile.name,
        Username: profile.username,
        Email: profile.email,
        Role: profile.role,
      });
    } catch (err) {
      console.error("❌ profileController.getProfileById error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
  
  async updateProfileById(req, res) {
    try {
      const userId = req.params.userID;
      const { Name, Email, Role } = req.body;
      // You will need to create updateProfileById in your userModel.js!
      await userModel.updateProfileById(userId, { Name, Email, Role });
      res.json({ success: true });
    } catch (err) {
      console.error("❌ profileController.updateProfileById error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
};
