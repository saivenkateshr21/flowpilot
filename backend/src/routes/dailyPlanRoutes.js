const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/dailyPlanController");
module.exports = createResourceRoutes(controller);
