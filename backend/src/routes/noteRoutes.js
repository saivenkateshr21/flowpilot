const createResourceRoutes = require("./resourceRoutes");
const controller = require("../controllers/noteController");
module.exports = createResourceRoutes(controller);
