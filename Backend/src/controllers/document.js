// src/controllers/documentController.js
const documentService = require('../services/document');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

class DocumentController {

  // Upload and process document
  async uploadDocument(req, res) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        return errorResponse(res, 'Only PDF files are allowed', 400);
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxSize) {
        return errorResponse(res, 'File size too large. Maximum 50MB allowed', 400);
      }

      const userId = req.user.id;
      
      console.log(`Processing upload: ${req.file.originalname} (${req.file.size} bytes)`);

      // Process document (async - happens in background)
      const result = await documentService.processDocument(req.file, userId);

      return successResponse(
        res,
        result.document,
        result.message,
        201
      );

    } catch (error) {
      console.error('Upload document error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  // Get user's documents
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit, offset } = req.query;

      const options = {};
      
      if (status) {
        options.where = { processing_status: status };
      }
      
      if (limit) {
        options.limit = parseInt(limit);
      }
      
      if (offset) {
        options.offset = parseInt(offset);
      }

      const result = await documentService.getUserDocuments(userId, options);

      return successResponse(
        res,
        {
          documents: result.documents,
          total: result.count,
          filters: { status, limit, offset }
        },
        'Documents retrieved successfully',
        200
      );

    } catch (error) {
      console.error('Get documents error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  // Get specific document
  async getDocument(req, res) {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;

      const result = await documentService.getDocumentById(documentId, userId);

      return successResponse(
        res,
        result.document,
        'Document retrieved successfully',
        200
      );

    } catch (error) {
      console.error('Get document error:', error);
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Delete document
  async deleteDocument(req, res) {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;

      const result = await documentService.deleteDocument(documentId, userId);

      return successResponse(
        res,
        null,
        result.message,
        200
      );

    } catch (error) {
      console.error('Delete document error:', error);
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Get processing status
  async getProcessingStatus(req, res) {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;

      const result = await documentService.getProcessingStatus(documentId, userId);

      return successResponse(
        res,
        result.document,
        `Document status: ${result.status}`,
        200
      );

    } catch (error) {
      console.error('Get processing status error:', error);
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new DocumentController();
