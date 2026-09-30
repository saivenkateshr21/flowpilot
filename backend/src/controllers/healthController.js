const mongoose = require("mongoose");

const health = (req, res) => {
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const status = database === "connected" ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({ status, database, service: "flowpilot-api", timestamp: new Date().toISOString() });
};

module.exports = { health };
