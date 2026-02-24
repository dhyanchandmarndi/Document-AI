// src/services/documentService.js
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { db } = require("../models");
const { getEmbeddings } = require("../utils/embedding-model");
const ChromaHelper = require("../utils/chromaHelper");
const { ParagraphChunker } = require("../services/ParagraphChunker");
const logger = require("../config/logger");

const chromaHelper = new ChromaHelper();

class DocumentService {
  // Process uploaded PDF file
  async processDocument(file, userId) {
    let document = null;
    const startTime = Date.now();

    try {
      logger.info("Document processing started", {
        userId,
        filename: file.originalname,
        fileSizeBytes: file.size,
      });

      // 1. Create document record in database
      document = await db.Document.create({
        user_id: userId,
        original_filename: file.originalname,
        file_size: file.size,
        processing_status: "uploading",
      });

      logger.debug("Document record created", {
        documentId: document.id,
        userId,
      });

      // 2. Mark as processing
      await document.markAsProcessing();

      // 3. Extract text from PDF
      const { text, pageCount } = await this.extractTextFromPDF(file.buffer);

      logger.debug("Text extraction complete", {
        documentId: document.id,
        userId,
        pageCount,
        characterCount: text.length,
      });

      // 4. Create chunks using ParagraphChunker
      const chunker = new ParagraphChunker({
        maxTokens: 1000,
        minTokens: 100,
        overlapTokens: 50,
        combineThreshold: 200,
      });

      const chunks = await chunker.chunk(text, {
        documentId: document.id,
        filename: file.originalname,
        userId: userId,
      });

      const chunkCount = chunks.length;

      logger.debug("Document chunking complete", {
        documentId: document.id,
        userId,
        chunkCount,
      });

      // 5. Store in ChromaDB
      const chromaCollectionId = `user_${userId}_documents`;
      await chromaHelper.storeInChromaDB(chromaCollectionId, chunks);

      logger.debug("Chunks stored in ChromaDB", {
        documentId: document.id,
        userId,
        chunkCount,
        chromaCollectionId,
      });

      // 6. Mark as completed
      await document.markAsCompleted(pageCount, chunkCount, chromaCollectionId);

      const processingTimeMs = Date.now() - startTime;

      // Rich info log — great for tracking performance and costs over time
      logger.info("Document processing completed", {
        documentId: document.id,
        userId,
        filename: file.originalname,
        fileSizeBytes: file.size,
        pageCount,
        chunkCount,
        chromaCollectionId,
        processingTimeMs,
      });

      return {
        success: true,
        document: document,
        message: "Document processed successfully",
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      logger.error("Document processing failed", {
        documentId: document?.id || null,
        userId,
        filename: file.originalname,
        error: error.message,
        processingTimeMs, // useful to know how far it got before failing
      });

      if (document) {
        await document.markAsFailed(error.message);
      }

      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  // Extract text from PDF buffer
  async extractTextFromPDF(pdfBuffer) {
    try {
      logger.debug("PDF text extraction started");

      const pdfData = await pdfParse(pdfBuffer);

      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      logger.debug("PDF text extraction complete", {
        pageCount: pdfData.numpages,
        characterCount: pdfData.text.length,
        hasTitle: !!pdfData.info?.Title,
        hasAuthor: !!pdfData.info?.Author,
      });

      return {
        text: pdfData.text.trim(),
        pageCount: pdfData.numpages,
        metadata: {
          title: pdfData.info?.Title || null,
          author: pdfData.info?.Author || null,
          createdAt: pdfData.info?.CreationDate || null,
        },
      };
    } catch (error) {
      logger.error("PDF text extraction failed", { error: error.message });
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Get user's documents
  async getUserDocuments(userId, options = {}) {
    try {
      const documents = await db.Document.findByUser(userId, {
        attributes: [
          "id",
          "original_filename",
          "file_size",
          "total_pages",
          "chunk_count",
          "processing_status",
          "processed_at",
          "created_at",
        ],
        ...options,
      });

      logger.debug("Fetched user documents", {
        userId,
        count: documents.length,
      });

      return {
        success: true,
        documents: documents,
        count: documents.length,
      };
    } catch (error) {
      logger.error("Failed to get user documents", {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get user documents: ${error.message}`);
    }
  }

  // Get document details
  async getDocumentById(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: {
          id: documentId,
          user_id: userId,
        },
      });

      if (!document) {
        logger.warn("Document not found", { documentId, userId });
        throw new Error("Document not found");
      }

      logger.debug("Fetched document by ID", { documentId, userId });

      return {
        success: true,
        document: document,
      };
    } catch (error) {
      logger.error("Failed to get document", {
        documentId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  // Delete document
  async deleteDocument(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: {
          id: documentId,
          user_id: userId,
        },
      });

      if (!document) {
        logger.warn("Document not found for deletion", { documentId, userId });
        throw new Error("Document not found");
      }

      // TODO: delete from ChromaDB
      logger.warn("ChromaDB cleanup skipped — not yet implemented", {
        documentId,
        chromaCollectionId: document.chroma_collection_id,
      });

      await document.destroy();

      logger.info("Document deleted", {
        documentId,
        userId,
        filename: document.original_filename,
      });

      return {
        success: true,
        message: "Document deleted successfully",
      };
    } catch (error) {
      logger.error("Failed to delete document", {
        documentId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Get processing status
  async getProcessingStatus(documentId, userId) {
    try {
      const document = await db.Document.findOne({
        where: {
          id: documentId,
          user_id: userId,
        },
        attributes: [
          "id",
          "original_filename",
          "processing_status",
          "processing_error",
          "total_pages",
          "chunk_count",
          "processed_at",
        ],
      });

      if (!document) {
        logger.warn("Document not found for status check", {
          documentId,
          userId,
        });
        throw new Error("Document not found");
      }

      logger.debug("Fetched document processing status", {
        documentId,
        userId,
        status: document.processing_status,
      });

      return {
        success: true,
        status: document.processing_status,
        document: document,
      };
    } catch (error) {
      logger.error("Failed to get processing status", {
        documentId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get processing status: ${error.message}`);
    }
  }
}

module.exports = new DocumentService();
