const winston = require("winston");
const path = require("path");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Custom format for development (human-readable)
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
    if (stack) log += `\n${stack}`;
    return log;
  }),
);

// Production format (structured JSON for log aggregators)
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: { service: "document-ai" }, // appears in every log automatically
  transports: [
    new winston.transports.Console(),

    // In production, also write to files
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: path.join("logs", "error.log"),
            level: "error",
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join("logs", "combined.log"),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: path.join("logs", "exceptions.log"),
          }),
        ]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: path.join("logs", "rejections.log"),
          }),
        ]
      : []),
  ],
});

module.exports = logger;
