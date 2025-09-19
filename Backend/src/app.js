const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// const chunkingRoutes = require("./routes/chunking");
// const { validateChunkingRequest } = require("./middleware/validation");

const { testConnection } = require('./models');
const userRoutes = require('./routes/user');

const PORT = process.env.PORT || 8000;
const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

// Routes
app.use('/api/auth', authLimiter, userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is running', 
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Document AI Backend API',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      }
    }
  });
});

// app.use("/api/chunking", validateChunkingRequest, chunkingRoutes);

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Cannot start server without database connection');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
