const morgan = require("morgan");
const logger = require("./logger");

// Stream morgan output into winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

const morganMiddleware = morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev",
  { stream },
);

module.exports = morganMiddleware;
