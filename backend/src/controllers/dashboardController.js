const asyncHandler = require("../utils/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Event = require("../models/Event");
const Reminder = require("../models/Reminder");

const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const now = new Date();
  const [taskStats, projectStats, upcomingEvents, upcomingReminders] = await Promise.all([
    Task.aggregate([
      { $match: { user } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Project.aggregate([
      { $match: { user } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Event.countDocuments({ user, startTime: { $gte: now } }),
    Reminder.countDocuments({ user, remindAt: { $gte: now }, completed: false })
  ]);

  const toCounts = (items) => items.reduce((result, item) => ({ ...result, [item._id]: item.count }), {});
  const tasks = toCounts(taskStats);
  const projects = toCounts(projectStats);
  const overdue = await Task.countDocuments({ user, status: { $ne: "completed" }, dueDate: { $lt: now } });

  res.json({
    tasks: { total: Object.values(tasks).reduce((sum, count) => sum + count, 0), ...tasks, overdue },
    projects: { total: Object.values(projects).reduce((sum, count) => sum + count, 0), ...projects },
    upcomingEvents,
    upcomingReminders
  });
});

module.exports = { getDashboard };
