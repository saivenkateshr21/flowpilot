const createResourceController = require("./resourceController");
const Project = require("../models/Project");
module.exports = createResourceController(Project);
