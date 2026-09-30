const requiredEnvVariables = ["MONGODB_URI", "JWT_SECRET", "GROQ_API_KEY", "GROQ_MODEL"];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is missing`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};
