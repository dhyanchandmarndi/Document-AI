// src/routes/documentRoutes.js
const express = require('express');
const documentController = require('../controllers/document');
const { authenticateToken } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

// Upload and process document
router.post('/upload', 
  uploadMiddleware,           // Handle file upload
  documentController.uploadDocument
);

// Get user's documents
router.get('/', documentController.getDocuments);

// Get specific document details
router.get('/:id', documentController.getDocument);

// Get document processing status
router.get('/:id/status', documentController.getProcessingStatus);

// Delete document
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
