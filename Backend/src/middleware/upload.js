// src/middleware/upload.js
const multer = require('multer');
const { errorResponse } = require('../utils/response');

// Configure multer for memory storage (we don't save files to disk)
const storage = multer.memoryStorage();

// File filter for PDFs only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware wrapper for better error handling
const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('document');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 'File too large. Maximum size is 50MB', 400);
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return errorResponse(res, 'Too many files. Upload one file at a time', 400);
      }
      return errorResponse(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return errorResponse(res, err.message, 400);
    }
    
    next();
  });
};

module.exports = {
  uploadMiddleware
};
