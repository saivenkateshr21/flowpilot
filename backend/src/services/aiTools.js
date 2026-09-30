const Task = require("../models/Task");
const Reminder = require("../models/Reminder");
const Event = require("../models/Event");
const Project = require("../models/Project");
const DailyPlan = require("../models/DailyPlan");
const { normalizeToolArgs } = require("../utils/dateTime");

const owned = (userId, data) => ({ ...data, user: userId });
const cleanData = (name, data) => {
  const safeData = { ...data };
  delete safeData.user;
  delete safeData._id;
  return normalizeToolArgs(name, safeData);
};

const tools = {
  createTask: (userId, data) => Task.create(owned(userId, cleanData("createTask", data))),
  updateTask: (userId, id, data) => Task.findOneAndUpdate({ _id: id, user: userId }, cleanData("updateTask", data), { new: true, runValidators: true }),
  deleteTask: (userId, id) => Task.findOneAndDelete({ _id: id, user: userId }),
  getTasks: (userId, filters = {}) => {
    const { user: ignoredUser, ...safeFilters } = filters;
    return Task.find({ user: userId, ...safeFilters }).sort({ dueDate: 1 });
  },
  createReminder: (userId, data) => Reminder.create(owned(userId, cleanData("createReminder", data))),
  createEvent: (userId, data) => Event.create(owned(userId, cleanData("createEvent", data))),
  createProject: (userId, data) => Project.create(owned(userId, cleanData("createProject", data))),
  createDailyPlan: (userId, data) => DailyPlan.create(owned(userId, cleanData("createDailyPlan", data)))
};

const executeTool = async (userId, name, args = {}) => {
  if (!tools[name]) throw Object.assign(new Error(`Unknown AI tool: ${name}`), { statusCode: 400 });
  const { id, ...data } = args;
  const result = ["updateTask", "deleteTask"].includes(name)
    ? tools[name](userId, id, data)
    : tools[name](userId, data);
  return result;
};

module.exports = { tools, executeTool };
