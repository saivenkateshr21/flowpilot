const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, default: "" }
}, { timestamps: true });

eventSchema.pre("validate", function validateTimes(next) {
  if (this.endTime <= this.startTime) return next(new Error("endTime must be after startTime"));
  next();
});

module.exports = mongoose.model("Event", eventSchema);
