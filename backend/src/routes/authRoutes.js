const express = require("express");
const { register, login, getMe, refresh, logout, updateProfile, changePassword } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { validate, required } = require("../middleware/validationMiddleware");

const router = express.Router();
router.post("/register", validate([required("name", "email", "password")]), register);
router.post("/login", validate([required("email", "password")]), login);
router.get("/me", protect, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
module.exports = router;
