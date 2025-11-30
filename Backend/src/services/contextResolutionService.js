// src/services/contextResolutionService.js
const { db } = require('../models');

class ContextResolutionService {
  
  /**
   * Resolve which documents to use for the query based on context
   */
  async resolveDocumentContext(userId, queryText, explicitDocumentIds, conversationId) {
    // Priority 1: User explicitly attached documents
    if (explicitDocumentIds && explicitDocumentIds.length > 0) {
      console.log('Using explicitly attached documents:', explicitDocumentIds);
      return {
        documentIds: explicitDocumentIds,
        source: 'explicit',
        contextUsed: false
      };
    }

    // Priority 2: Use conversation context if available
    if (conversationId) {
      const contextDocs = await this.getConversationContextDocuments(conversationId, userId);
      
      if (contextDocs.length > 0) {
        console.log('Using conversation context documents:', contextDocs);
        return {
          documentIds: contextDocs,
          source: 'conversation_context',
          contextUsed: true
        };
      }
    }

    // Priority 3: Check if query suggests document reference
    const hasDocumentReference = this.detectDocumentReference(queryText);
    
    if (hasDocumentReference && conversationId) {
      // Try to find documents from recent messages
      const recentDocs = await this.getRecentDocuments(conversationId, userId, 5);
      
      if (recentDocs.length > 0) {
        console.log('Detected reference, using recent documents:', recentDocs);
        return {
          documentIds: recentDocs,
          source: 'reference_detected',
          contextUsed: true
        };
      }
    }

    // Priority 4: No documents available - general query
    console.log('No documents available for context');
    return {
      documentIds: [],
      source: 'no_documents',
      contextUsed: false
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
          user_id: userId
        },
        attributes: ['document_ids'],
        order: [['created_at', 'DESC']],
        limit: lookback
      });

      // Collect unique document IDs from recent messages
      const documentIds = new Set();
      messages.forEach(msg => {
        if (msg.document_ids && Array.isArray(msg.document_ids)) {
          msg.document_ids.forEach(id => documentIds.add(id));
        }
      });

      return Array.from(documentIds);
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }

  /**
   * Get documents from recent messages (broader search)
   */
  async getRecentDocuments(conversationId, userId, lookback = 5) {
    return this.getConversationContextDocuments(conversationId, userId, lookback);
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
      /^(and|also|additionally|furthermore|moreover)/i
    ];

    return referencePatterns.some(pattern => pattern.test(queryText));
  }

  /**
   * Get all user documents (fallback option)
   */
  async getAllUserDocuments(userId) {
    try {
      const documents = await db.Document.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });

      return documents.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting all user documents:', error);
      return [];
    }
  }
}

module.exports = new ContextResolutionService();
