const createResourceController = require("./resourceController");
const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");

const controller = createResourceController(Task);
const updateStatus = asyncHandler(async (req, res) => {
	const task = await Task.findOneAndUpdate(
		{ _id: req.params.id, user: req.user._id },
		{ status: req.body.status, completedAt: req.body.status === "completed" ? new Date() : null },
		{ new: true, runValidators: true }
	);
	if (!task) return res.status(404).json({ message: "Task not found." });
	res.json(task);
});

const updatePriority = asyncHandler(async (req, res) => {
	const task = await Task.findOneAndUpdate(
		{ _id: req.params.id, user: req.user._id },
		{ priority: req.body.priority },
		{ new: true, runValidators: true }
	);
	if (!task) return res.status(404).json({ message: "Task not found." });
	res.json(task);
});

module.exports = { ...controller, updateStatus, updatePriority };
