const cron = require("node-cron");
const Reminder = require("../models/Reminder");

const startReminderScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const due = await Reminder.find({
        remindAt: { $lte: new Date() },
        completed: false,
      }).select("_id user title remindAt");

      if (due.length) {
        console.log(
          `Reminder scheduler found ${due.length} due reminder(s).`
        );

        for (const reminder of due) {
          try {
            console.log(
              `Processing reminder: ${reminder.title} (${reminder._id})`
            );

            await Reminder.findByIdAndUpdate(reminder._id, {
              $set: { completed: true },
            });
          } catch (error) {
            console.error(
              `Failed to process reminder ${reminder._id}:`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error("Reminder scheduler failed:", error.message);
    }
  });
};

module.exports = { startReminderScheduler };