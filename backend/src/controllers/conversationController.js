const asyncHandler = require("../utils/asyncHandler");
const AIConversation = require("../models/AIConversation");

const list = asyncHandler(async (req, res) => {
  const conversations = await AIConversation.find({ user: req.user._id }).sort({ updatedAt: -1 }).select("title messages createdAt updatedAt");
  res.json(conversations);
});

const create = asyncHandler(async (req, res) => {
  const conversation = await AIConversation.create({ user: req.user._id, title: req.body.title || "New conversation" });
  res.status(201).json(conversation);
});

const get = asyncHandler(async (req, res) => {
  const conversation = await AIConversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });
  res.json(conversation);
});

const remove = asyncHandler(async (req, res) => {
  const conversation = await AIConversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ message: "Conversation not found." });
  res.json({ message: "Conversation deleted successfully." });
});

module.exports = { list, create, get, remove };
