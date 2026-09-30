const createResourceController = require("./resourceController");
const Event = require("../models/Event");
module.exports = createResourceController(Event);
