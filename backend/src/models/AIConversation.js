const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["system", "user", "assistant", "tool"], required: true },
  content: { type: String, required: true, maxlength: 20000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "New conversation", trim: true },
  messages: { type: [messageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("AIConversation", conversationSchema);
