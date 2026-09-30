const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { frontendUrl } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const openapi = require("./docs/openapi");
const { health } = require("./controllers/healthController");

const app = express();
const allowedOrigins = [frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"];
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: "draft-8", legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });

app.get("/", (req, res) => res.json({ message: "FlowPilot API is running" }));
app.get("/api/health", health);
app.get("/api-docs/openapi.json", (req, res) => res.json(openapi));
app.get("/api-docs", (req, res) => res.type("html").send("<h1>FlowPilot API</h1><p>OpenAPI document: <a href='/api-docs/openapi.json'>/api-docs/openapi.json</a></p>"));
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/reminders", require("./routes/reminderRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/daily-plans", require("./routes/dailyPlanRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/ai", aiLimiter, require("./routes/aiRoutes"));
app.use("/api/ai/conversations", aiLimiter, require("./routes/conversationRoutes"));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
