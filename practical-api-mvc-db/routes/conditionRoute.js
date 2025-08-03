const express = require("express");
const router = express.Router();
const controller = require("../controllers/conditionController");
const validate = require("../middleware/validateCondition");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, controller.list);
router.post("/", auth, validate, controller.create);
router.put("/:id", auth, validate, controller.update);
router.delete("/:id", auth, controller.delete);

module.exports = router;
