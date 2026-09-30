const asyncHandler = require("../utils/asyncHandler");
const Task = require("../models/Task");
const Note = require("../models/Note");
const Project = require("../models/Project");
const Event = require("../models/Event");
const Reminder = require("../models/Reminder");

const search = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) return res.status(400).json({ message: "q is required." });
  const pattern = { $regex: query, $options: "i" };
  const user = req.user._id;
  const [tasks, notes, projects, events, reminders] = await Promise.all([
    Task.find({ user, $or: [{ title: pattern }, { description: pattern }, { category: pattern }] }).limit(20).lean(),
    Note.find({ user, $or: [{ title: pattern }, { content: pattern }, { tags: pattern }] }).limit(20).lean(),
    Project.find({ user, $or: [{ name: pattern }, { description: pattern }] }).limit(20).lean(),
    Event.find({ user, $or: [{ title: pattern }, { description: pattern }, { location: pattern }] }).limit(20).lean(),
    Reminder.find({ user, $or: [{ title: pattern }, { description: pattern }] }).limit(20).lean()
  ]);
  res.json({ tasks, notes, projects, events, reminders });
});

module.exports = { search };
