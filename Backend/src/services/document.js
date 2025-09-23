// src/services/documentService.js
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
// const { v4: uuidv4 } = require('uuid');
const { db } = require('../models');

class DocumentService {
  
  // Process uploaded PDF file
  async processDocument(file, userId) {
    let document = null;
    
    try {
      console.log(`Starting document processing for user ${userId}`);
      
      // 1. Create document record in database
      document = await db.Document.create({
        user_id: userId,
        original_filename: file.originalname,
        file_size: file.size,
        processing_status: 'uploading'
      });

      console.log(`Document record created: ${document.id}`);

      // 2. Mark as processing
      await document.markAsProcessing();
      console.log(`Document marked as processing`);

      // 3. Extract text from PDF
      const { text, pageCount } = await this.extractTextFromPDF(file.buffer);
      console.log(`Extracted text from ${pageCount} pages`);

      // 4. For now, we'll just complete without ChromaDB (we'll add that later)
      const chunkCount = Math.ceil(text.length / 1000); // Estimate chunks
      const chromaCollectionId = `doc_${document.id}_chunks`;

      // 5. Mark as completed
      await document.markAsCompleted(pageCount, chunkCount, chromaCollectionId);
      console.log(`Document processing completed`);

      // 6. File buffer is automatically garbage collected (no storage)
      console.log(`PDF buffer released from memory`);

      return {
        success: true,
        document: document,
        message: 'Document processed successfully'
      };

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Mark document as failed if it was created
      if (document) {
        await document.markAsFailed(error.message);
      }
      
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  // Extract text from PDF buffer
  async extractTextFromPDF(pdfBuffer) {
    try {
      console.log('🔍 Starting PDF text extraction...');
      
      const pdfData = await pdfParse(pdfBuffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      console.log(`PDF Stats: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);

      return {
        text: pdfData.text.trim(),
        pageCount: pdfData.numpages,
        metadata: {
          title: pdfData.info?.Title || null,
          author: pdfData.info?.Author || null,
          createdAt: pdfData.info?.CreationDate || null
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Get user's documents
  async getUserDocuments(userId, options = {}) {
    try {
      const documents = await db.Document.findByUser(userId, {
        attributes: [
          'id', 
          'original_filename', 
          'file_size', 
          'total_pages', 
          'chunk_count',
          'processing_status', 
          'processed_at', 
          'created_at'
        ],
        ...options
      });

      return {
        success: true,
        documents: documents,
        count: documents.length
      };
    } catch (error) {
      console.error('Get user documents error:', error);
      throw new Error(`Failed to get user documents: ${error.message}`);
    }
  }

  // Get document details
  async getDocumentById(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: { 
          id: documentId, 
          user_id: userId 
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        success: true,
        document: document
      };
    } catch (error) {
      console.error('Get document error:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  // Delete document
  async deleteDocument(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: { 
          id: documentId, 
          user_id: userId 
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // TODO: Later we'll also delete from ChromaDB here
      console.log(`Would delete ChromaDB collection: ${document.chroma_collection_id}`);

      await document.destroy();
      console.log(`Document deleted: ${documentId}`);

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error('Delete document error:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Get processing status
  async getProcessingStatus(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: { 
          id: documentId, 
          user_id: userId 
        },
        attributes: [
          'id', 
          'original_filename',
          'processing_status', 
          'processing_error',
          'total_pages',
          'chunk_count',
          'processed_at'
        ]
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        success: true,
        status: document.processing_status,
        document: document
      };
    } catch (error) {
      console.error('Get processing status error:', error);
      throw new Error(`Failed to get processing status: ${error.message}`);
    }
  }
}

module.exports = new DocumentService();
