const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/projectController");
module.exports = createResourceRoutes(controller);
