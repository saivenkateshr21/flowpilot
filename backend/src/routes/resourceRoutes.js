const express = require("express");
const protect = require("../middleware/authMiddleware");

const createResourceRoutes = (controller) => {
  const router = express.Router();
  router.use(protect);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.get);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
};

module.exports = createResourceRoutes;
