const createResourceController = require("./resourceController");
const DailyPlan = require("../models/DailyPlan");
module.exports = createResourceController(DailyPlan);
