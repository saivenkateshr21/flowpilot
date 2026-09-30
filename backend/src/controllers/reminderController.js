const createResourceController = require("./resourceController");
const Reminder = require("../models/Reminder");
module.exports = createResourceController(Reminder);
