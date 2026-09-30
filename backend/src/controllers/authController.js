const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });
const refreshCookie = "flowpilot_refresh";
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const readCookie = (req, name) => String(req.headers.cookie || "").split(";").map((part) => part.trim().split("=")).find(([key]) => key === name)?.[1];
const setRefreshCookie = (res, token) => res.cookie(refreshCookie, token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: refreshLifetimeMs,
  path: "/api/auth"
});
const clearRefreshCookie = (res) => res.clearCookie(refreshCookie, { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth" });
const createSession = async (user) => {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshLifetimeMs);
  await user.save();
  return { token: generateToken(user._id), refreshToken };
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) return res.status(409).json({ message: "User already exists." });

  const user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12) });
  const session = await createSession(user);
  setRefreshCookie(res, session.refreshToken);
  res.status(201).json({ message: "Registration successful.", token: session.token, user: publicUser(user) });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const session = await createSession(user);
  setRefreshCookie(res, session.refreshToken);
  res.json({ message: "Login successful.", token: session.token, user: publicUser(user) });
};

const getMe = (req, res) => res.json({ user: req.user });

const refresh = async (req, res) => {
  const refreshToken = readCookie(req, refreshCookie);
  if (!refreshToken) return res.status(401).json({ message: "Refresh token missing." });
  const user = await User.findOne({ refreshTokenHash: hashRefreshToken(refreshToken) }).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt <= new Date()) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Refresh token is invalid or expired." });
  }
  const session = await createSession(user);
  setRefreshCookie(res, session.refreshToken);
  res.json({ token: session.token });
};
const logout = async (req, res) => {
  const refreshToken = readCookie(req, refreshCookie);
  if (refreshToken) await User.updateOne({ refreshTokenHash: hashRefreshToken(refreshToken) }, { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } });
  clearRefreshCookie(res);
  res.json({ message: "Logged out successfully." });
};

const updateProfile = async (req, res) => {
  const changes = {};
  if (req.body.name !== undefined) changes.name = req.body.name;
  if (req.body.email !== undefined) changes.email = req.body.email.toLowerCase().trim();
  const user = await User.findByIdAndUpdate(req.user._id, changes, { new: true, runValidators: true }).select("-password");
  res.json({ user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Current password and a new password of at least 6 characters are required." });
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: "Current password is incorrect." });
  user.password = await bcrypt.hash(newPassword, 12);
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
  res.json({ message: "Password changed successfully." });
};

module.exports = { register, login, getMe, refresh, logout, updateProfile, changePassword };
