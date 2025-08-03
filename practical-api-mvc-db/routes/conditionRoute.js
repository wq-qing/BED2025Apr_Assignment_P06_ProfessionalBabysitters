const express = require("express");
const router = express.Router();
const conditionController = require("../controllers/conditionController");
const { requireAuth } = require("../../practical-api-mvc-db/middlewares/authMiddleware");

router.use(requireAuth);

router.get("/", conditionController.list);
router.post("/", conditionController.create);
router.put("/:id", conditionController.update);
router.delete("/:id", conditionController.delete);

module.exports = router;
