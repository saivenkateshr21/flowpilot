const asyncHandler = require("../utils/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Event = require("../models/Event");

const getProductivity = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const [total, completed, pending, overdue, activeProjects, upcomingEvents] = await Promise.all([
    Task.countDocuments({ user }),
    Task.countDocuments({ user, status: "completed" }),
    Task.countDocuments({ user, status: { $ne: "completed" } }),
    Task.countDocuments({ user, status: { $ne: "completed" }, dueDate: { $lt: new Date() } }),
    Project.countDocuments({ user, status: "active" }),
    Event.countDocuments({ user, startTime: { $gte: new Date() } })
  ]);
  res.json({ tasksCompleted: completed, tasksPending: pending, tasksOverdue: overdue, completionRate: total ? Math.round((completed / total) * 100) : 0, activeProjects, upcomingEvents });
});

const getTasksAnalytics = asyncHandler(async (req, res) => {
  const groups = await Task.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: { status: "$status", priority: "$priority" }, count: { $sum: 1 } } },
    { $sort: { "_id.status": 1, "_id.priority": 1 } }
  ]);
  res.json({ data: groups });
});

module.exports = { getProductivity, getTasksAnalytics };
