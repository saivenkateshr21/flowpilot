const express = require("express");
const protect = require("../middleware/authMiddleware");
const { chat, agent, createTask, plan, prioritize, summarize, productivity } = require("../controllers/aiController");

const router = express.Router();
router.use(protect);
router.post("/chat", chat);
router.post("/agent", agent);
router.post("/create-task", createTask);
router.post("/plan", plan);
router.post("/prioritize", prioritize);
router.post("/summarize", summarize);
router.post("/productivity", productivity);
module.exports = router;
