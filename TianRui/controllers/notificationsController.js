const { poolPromise, sql } = require("../db");

module.exports = {
  async getNotifications(req, res) {
    const { userId } = req.query;
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("userId", sql.VarChar, userId)
        .query("SELECT * FROM Notifications WHERE userId = @userId ORDER BY createdAt DESC");
      res.json(result.recordset);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },

  async markAsRead(req, res) {
    const { id } = req.body;
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id)
        .query("UPDATE Notifications SET isRead = 1 WHERE id = @id");
      res.json({ success: true });
    } catch (err) {
      console.error("Mark notification error:", err);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  }
};
