const ConditionModel = require("../models/conditionModel");

const ConditionController = {
  async list(req, res) {
    try {
      const { id, role } = req.user;
      const conditions = await ConditionModel.getAllByUser(id, role);
      res.json(conditions);
    } catch (err) {
      res.status(500).json({ error: "Failed to load conditions" });
    }
  },

  async create(req, res) {
    try {
      const { role, id } = req.user;
      const targetUserId = role === "Doctor" ? req.body.userId : id;
      await ConditionModel.add(req.body, targetUserId);
      res.sendStatus(201);
    } catch (err) {
      res.status(500).json({ error: "Failed to create condition" });
    }
  },

  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      await ConditionModel.update(id, req.body);
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ error: "Failed to update condition" });
    }
  },

  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      await ConditionModel.remove(id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: "Failed to delete condition" });
    }
  }
};

module.exports = ConditionController;
