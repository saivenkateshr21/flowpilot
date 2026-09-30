const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/eventController");
module.exports = createResourceRoutes(controller);
