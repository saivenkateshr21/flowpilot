const asyncHandler = require("../utils/asyncHandler");

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getFilters = (Model, query, userId) => {
  const filters = { user: userId };
  const allowed = ["status", "priority", "category", "completed"];
  for (const field of allowed) {
    if (query[field] !== undefined && ["Task", "Project", "Reminder"].includes(Model.modelName)) {
      filters[field] = query[field];
    }
  }

  if (query.search) {
    const searchFields = Model.modelName === "Project" ? ["name", "description"] : ["title", "description"];
    filters.$or = searchFields.map((field) => ({ [field]: { $regex: query.search, $options: "i" } }));
  }

  if (query.dueDate === "today" && Model.modelName === "Task") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filters.dueDate = { $gte: start, $lt: end };
  }
  return filters;
};

const createResourceController = (Model) => ({
  list: asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filters = getFilters(Model, req.query, req.user._id);
    const [documents, total] = await Promise.all([
      Model.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(filters)
    ]);
    res.json({ data: documents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }),
  create: asyncHandler(async (req, res) => {
    const document = await Model.create({ ...req.body, user: req.user._id });
    res.status(201).json(document);
  }),
  get: asyncHandler(async (req, res) => {
    const document = await Model.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) return res.status(404).json({ message: "Resource not found." });
    res.json(document);
  }),
  update: asyncHandler(async (req, res) => {
    const safeChanges = { ...req.body };
    delete safeChanges.user;
    const document = await Model.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, safeChanges,
      { new: true, runValidators: true }
    );
    if (!document) return res.status(404).json({ message: "Resource not found." });
    res.json(document);
  }),
  remove: asyncHandler(async (req, res) => {
    const document = await Model.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!document) return res.status(404).json({ message: "Resource not found." });
    res.json({ message: "Resource deleted successfully." });
  })
});

module.exports = createResourceController;
