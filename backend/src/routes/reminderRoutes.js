const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/reminderController");
module.exports = createResourceRoutes(controller);
