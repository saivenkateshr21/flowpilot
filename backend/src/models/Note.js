const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, default: "" },
  tags: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
