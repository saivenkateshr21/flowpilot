const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getProductivity, getTasksAnalytics } = require("../controllers/analyticsController");

const router = express.Router();
router.use(protect);
router.get("/productivity", getProductivity);
router.get("/tasks", getTasksAnalytics);
module.exports = router;
