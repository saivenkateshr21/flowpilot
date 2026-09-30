const openapi = {
  openapi: "3.0.3",
  info: { title: "FlowPilot API", version: "1.0.0", description: "AI personal workflow agent API" },
  servers: [{ url: "http://localhost:5000" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/api/health": { get: { summary: "Service and database health" } },
    "/api/auth/register": { post: { summary: "Register a user" } },
    "/api/auth/login": { post: { summary: "Log in" } },
    "/api/tasks": { get: { summary: "List paginated tasks" }, post: { summary: "Create a task" } },
    "/api/dashboard": { get: { summary: "Get dashboard statistics", security: [{ bearerAuth: [] }] } },
    "/api/search": { get: { summary: "Search user workflow data", security: [{ bearerAuth: [] }] } },
    "/api/analytics/productivity": { get: { summary: "Get productivity analytics", security: [{ bearerAuth: [] }] } },
    "/api/ai/chat": { post: { summary: "Chat with FlowPilot", security: [{ bearerAuth: [] }] } },
    "/api/ai/agent": { post: { summary: "Ask FlowPilot to understand and execute a tool", security: [{ bearerAuth: [] }] } }
  }
};

module.exports = openapi;
