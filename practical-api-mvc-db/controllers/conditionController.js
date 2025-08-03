const ConditionModel = require("../models/conditionModel");

const ConditionController = {
  async list(req, res) {
    try {
      const { id, role } = req.user; // from middleware: { id, role }
      const conditions = await ConditionModel.getAllByUser(id, role);
      res.json(conditions);
    } catch (err) {
      console.error("❌ list error:", err);
      res.status(500).json({ error: "Failed to load conditions" });
    }
  },

  async create(req, res) {
    try {
      const { role, id } = req.user;
      const targetUserId = role === "Doctor" ? req.body.userId : id;
      if (!targetUserId) return res.status(400).json({ error: "Missing target userId" });

      const { name, startDate, status } = req.body;
      if (!name || !startDate || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await ConditionModel.add(req.body, targetUserId);
      res.sendStatus(201);
    } catch (err) {
      console.error("❌ create error:", err);
      res.status(500).json({ error: "Failed to create condition" });
    }
  },

  async update(req, res) {
    try {
      const idParam = parseInt(req.params.id, 10);
      if (isNaN(idParam)) return res.status(400).json({ error: "Invalid condition id" });

      const { name, startDate, status } = req.body;
      if (!name || !startDate || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await ConditionModel.update(idParam, req.body);
      res.sendStatus(200);
    } catch (err) {
      console.error("❌ update error:", err);
      res.status(500).json({ error: "Failed to update condition" });
    }
  },

  async delete(req, res) {
    try {
      const idParam = parseInt(req.params.id, 10);
      if (isNaN(idParam)) return res.status(400).json({ error: "Invalid condition id" });

      await ConditionModel.remove(idParam);
      res.sendStatus(204);
    } catch (err) {
      console.error("❌ delete error:", err);
      res.status(500).json({ error: "Failed to delete condition" });
    }
  }
};

module.exports = ConditionController;
