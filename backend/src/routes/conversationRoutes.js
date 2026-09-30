const express = require("express");
const protect = require("../middleware/authMiddleware");
const { list, create, get, remove } = require("../controllers/conversationController");

const router = express.Router();
router.use(protect);
router.get("/", list);
router.post("/", create);
router.get("/:id", get);
router.delete("/:id", remove);
module.exports = router;
