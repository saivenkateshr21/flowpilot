const mongoose = require("mongoose");

const dailyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: Date, required: true },
  title: { type: String, default: "Daily Plan" },
  tasks: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    title: String,
    scheduledTime: String,
    priority: { type: String, enum: ["low", "medium", "high"] },
    completed: { type: Boolean, default: false }
  }],
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

dailyPlanSchema.index({ user: 1, date: 1 });
module.exports = mongoose.model("DailyPlan", dailyPlanSchema);
