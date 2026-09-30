const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body. Use double quotes around property names and string values."
    });
  }

  console.error(error);
  const status = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error." : error.message,
    ...(process.env.NODE_ENV === "development" ? { error: error.message } : {})
  });
};

module.exports = { notFound, errorHandler };
