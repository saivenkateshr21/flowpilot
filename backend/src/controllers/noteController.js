const createResourceController = require("./resourceController");
const Note = require("../models/Note");
module.exports = createResourceController(Note);
