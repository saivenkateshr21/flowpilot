const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "" },
  status: { type: String, enum: ["planning", "active", "completed", "archived"], default: "planning" },
  deadline: Date
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
