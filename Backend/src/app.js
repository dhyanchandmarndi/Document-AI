const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
// const rateLimit = require('express-rate-limit');
require("dotenv").config();

// const chunkingRoutes = require("./routes/chunking");
// const { validateChunkingRequest } = require("./middleware/validation");

const { testConnection } = require("./models");
const userRoutes = require("./routes/user");
const documentRoutes = require("./routes/document");
const queryRoutes = require("./routes/query");
const chatRoutes = require('./routes/chatRoutes');

const PORT = process.env.PORT || 8000;
const app = express();

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:5173"],
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100
// });
// app.use('/api/', limiter);

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5
// });

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/query", queryRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Document AI Backend API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
        changePassword: "POST /api/auth/change-password",
      },
      documents: {
        upload: "POST /api/documents/upload",
        list: "GET /api/documents",
        get: "GET /api/documents/:id",
        status: "GET /api/documents/:id/status",
        delete: "DELETE /api/documents/:id",
      },
      query: {
        askQuestion: "POST /api/query",
        multiDocument: "POST /api/query/multiple",
        conversational: "POST /api/query/conversational",
      },
    },
  });
});

// app.use("/api/chunking", validateChunkingRequest, chunkingRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON payload",
    });
  }

  console.error("Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Cannot start server without database connection");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Query endpoint: http://localhost:${PORT}/api/query`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
