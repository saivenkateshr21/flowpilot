const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/taskController");
const express = require("express");
const protect = require("../middleware/authMiddleware");

const router = createResourceRoutes(controller);
router.patch("/:id/status", protect, controller.updateStatus);
router.patch("/:id/priority", protect, controller.updatePriority);
module.exports = router;
