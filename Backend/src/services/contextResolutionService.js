// src/services/contextResolutionService.js
const { db } = require("../models");
const logger = require("../config/logger");

class ContextResolutionService {
  /**
   * Resolve which documents to use for the query based on context
   */
  async resolveDocumentContext(
    userId,
    queryText,
    explicitDocumentIds,
    conversationId,
  ) {
    // Priority 1: User explicitly attached documents
    if (explicitDocumentIds && explicitDocumentIds.length > 0) {
      logger.debug("Using explicitly attached documents", {
        userId,
        conversationId,
        documentCount: explicitDocumentIds.length,
        source: "explicit",
      });
      return {
        documentIds: explicitDocumentIds,
        source: "explicit",
        contextUsed: false,
      };
    }

    // Priority 2: Use conversation context if available
    if (conversationId) {
      const contextDocs = await this.getConversationContextDocuments(
        conversationId,
        userId,
      );

      if (contextDocs.length > 0) {
        logger.debug("Using conversation context documents", {
          userId,
          conversationId,
          documentCount: contextDocs.length,
          source: "conversation_context",
        });
        return {
          documentIds: contextDocs,
          source: "conversation_context",
          contextUsed: true,
        };
      }
    }

    // Priority 3: Check if query suggests document reference
    const hasDocumentReference = this.detectDocumentReference(queryText);

    if (hasDocumentReference && conversationId) {
      const recentDocs = await this.getRecentDocuments(
        conversationId,
        userId,
        5,
      );

      if (recentDocs.length > 0) {
        logger.debug("Document reference detected, using recent documents", {
          userId,
          conversationId,
          documentCount: recentDocs.length,
          source: "reference_detected",
        });
        return {
          documentIds: recentDocs,
          source: "reference_detected",
          contextUsed: true,
        };
      }
    }

    // Priority 4: No documents available - general query
    logger.debug("No documents available, proceeding as general query", {
      userId,
      conversationId,
      hasDocumentReference,
    });
    return {
      documentIds: [],
      source: "no_documents",
      contextUsed: false,
    };
  }

  /**
   * Get documents from recent conversation messages (last N messages)
   */
  async getConversationContextDocuments(conversationId, userId, lookback = 3) {
    try {
      const messages = await db.Message.findAll({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        attributes: ["document_ids"],
        order: [["created_at", "DESC"]],
        limit: lookback,
      });

      const documentIds = new Set();
      messages.forEach((msg) => {
        if (msg.document_ids && Array.isArray(msg.document_ids)) {
          msg.document_ids.forEach((id) => documentIds.add(id));
        }
      });

      const result = Array.from(documentIds);

      logger.debug("Resolved conversation context documents", {
        conversationId,
        userId,
        messagesScanned: messages.length,
        uniqueDocumentsFound: result.length,
        lookback,
      });

      return result;
    } catch (error) {
      logger.error(
        "Failed to get conversation context documents, returning empty",
        {
          conversationId,
          userId,
          error: error.message,
        },
      );
      return [];
    }
  }

  /**
   * Get documents from recent messages (broader search)
   */
  async getRecentDocuments(conversationId, userId, lookback = 5) {
    return this.getConversationContextDocuments(
      conversationId,
      userId,
      lookback,
    );
  }

  /**
   * Detect if query references a document
   */
  detectDocumentReference(queryText) {
    const referencePatterns = [
      /\b(this|that|the|it|its)\b.*\b(document|file|pdf|report|paper)\b/i,
      /\b(what|tell me|explain|describe)\b.*\b(about|in)\b.*\b(it|this|that)\b/i,
      /\b(continue|more|further|additional)\b.*\b(details|information|info)\b/i,
      /\b(above|previous|earlier|mentioned)\b/i,
      /^(and|also|additionally|furthermore|moreover)/i,
    ];

    const matched = referencePatterns.some((pattern) =>
      pattern.test(queryText),
    );

    // Only log when a reference is actually detected — avoids noise on every query
    if (matched) {
      logger.debug("Document reference pattern detected in query");
    }

    return matched;
  }

  /**
   * Get all user documents (fallback option)
   */
  async getAllUserDocuments(userId) {
    try {
      const documents = await db.Document.findAll({
        where: { user_id: userId },
        attributes: ["id"],
      });

      const ids = documents.map((doc) => doc.id);

      logger.debug("Fetched all user documents", {
        userId,
        documentCount: ids.length,
      });

      return ids;
    } catch (error) {
      logger.error("Failed to get all user documents, returning empty", {
        userId,
        error: error.message,
      });
      return [];
    }
  }
}

module.exports = new ContextResolutionService();
