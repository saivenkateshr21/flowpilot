const validate = (rules) => (req, res, next) => {
  const errors = rules
    .map((rule) => rule(req.body, req.params, req.query))
    .filter(Boolean);

  if (errors.length) return res.status(400).json({ message: "Validation failed.", errors });
  next();
};

const required = (...fields) => (body) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === "");
  return missing.length ? `Missing required fields: ${missing.join(", ")}.` : null;
};

const oneOf = (field, values) => (body) => {
  if (body[field] === undefined || values.includes(body[field])) return null;
  return `${field} must be one of: ${values.join(", ")}.`;
};

module.exports = { validate, required, oneOf };
