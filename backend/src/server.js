require("dotenv").config();
require("./config/env");

const app = require("./app");
const connectDB = require("./config/db");
const { port } = require("./config/env");
const { startReminderScheduler } = require("./services/reminderScheduler");

const startServer = async () => {
  try {
    await connectDB();
    startReminderScheduler();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
