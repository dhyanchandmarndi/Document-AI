// src/services/chatService.js
const { db } = require("../models");
const logger = require("../config/logger");

class ChatService {
  // Create new conversation
  async createConversation(userId, title = "New Conversation") {
    try {
      const conversation = await db.Conversation.create({
        user_id: userId,
        title: title,
      });

      logger.info("Conversation created", {
        userId,
        conversationId: conversation.id,
        title,
      });

      return {
        success: true,
        conversation: conversation,
        message: "Conversation created successfully",
      };
    } catch (error) {
      logger.error("Failed to create conversation", {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  // Get user's conversations
  async getUserConversations(userId, options = {}) {
    try {
      const conversations = await db.Conversation.findByUser(userId, {
        include: [
          {
            model: db.Message,
            as: "messages",
            attributes: ["id", "query_text", "created_at"],
            limit: 1,
            order: [["created_at", "DESC"]],
          },
        ],
        ...options,
      });

      logger.debug("Fetched user conversations", {
        userId,
        count: conversations.length,
      });

      return {
        success: true,
        conversations: conversations,
        count: conversations.length,
      };
    } catch (error) {
      logger.error("Failed to get conversations", {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  // Get conversation with messages
  async getConversationWithMessages(conversationId, userId) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId,
        },
        include: [
          {
            model: db.Message,
            as: "messages",
            attributes: [
              "id",
              "query_text",
              "ai_response",
              "document_ids",
              "chunks_used",
              "processing_time",
              "model_name",
              "error",
              "error_message",
              "created_at",
            ],
          },
        ],
        order: [[{ model: db.Message, as: "messages" }, "created_at", "ASC"]],
      });

      if (!conversation) {
        logger.warn("Conversation not found", { conversationId, userId });
        throw new Error("Conversation not found");
      }

      const conversationData = conversation.toJSON();

      // Get all unique document IDs from all messages
      const allDocumentIds = new Set();
      conversationData.messages.forEach((msg) => {
        if (msg.document_ids && Array.isArray(msg.document_ids)) {
          msg.document_ids.forEach((id) => allDocumentIds.add(id));
        }
      });

      // Fetch all documents at once (efficient)
      let documentsMap = {};
      if (allDocumentIds.size > 0) {
        const documents = await db.Document.findAll({
          where: {
            id: Array.from(allDocumentIds),
            user_id: userId,
          },
          attributes: ["id", "original_filename", "total_pages", "chunk_count"],
        });

        documents.forEach((doc) => {
          documentsMap[doc.id] = {
            id: doc.id,
            name: doc.original_filename,
            pages: doc.total_pages,
            chunks: doc.chunk_count,
          };
        });
      }

      // Attach document details to each message
      conversationData.messages = conversationData.messages.map((msg) => ({
        ...msg,
        documents: msg.document_ids
          ? msg.document_ids.map((id) => documentsMap[id]).filter(Boolean)
          : [],
        errorMessage: msg.error_message || null,
      }));

      logger.debug("Fetched conversation with messages", {
        conversationId,
        userId,
        messageCount: conversationData.messages.length,
        uniqueDocuments: allDocumentIds.size,
      });

      return {
        success: true,
        conversation: conversationData,
      };
    } catch (error) {
      logger.error("Failed to get conversation", {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  // Update conversation title
  async updateConversationTitle(conversationId, userId, title) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (!conversation) {
        logger.warn("Conversation not found for title update", {
          conversationId,
          userId,
        });
        throw new Error("Conversation not found");
      }

      await conversation.updateTitle(title);

      logger.info("Conversation title updated", {
        conversationId,
        userId,
        title,
      });

      return {
        success: true,
        conversation: conversation,
        message: "Conversation title updated",
      };
    } catch (error) {
      logger.error("Failed to update conversation title", {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to update conversation: ${error.message}`);
    }
  }

  // Delete conversation
  async deleteConversation(conversationId, userId) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (!conversation) {
        logger.warn("Conversation not found for deletion", {
          conversationId,
          userId,
        });
        throw new Error("Conversation not found");
      }

      await conversation.destroy();

      logger.info("Conversation deleted", { conversationId, userId });

      return {
        success: true,
        message: "Conversation deleted successfully",
      };
    } catch (error) {
      logger.error("Failed to delete conversation", {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Create message in conversation
  async createMessage(conversationId, userId, messageData) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (!conversation) {
        logger.warn("Conversation not found for message creation", {
          conversationId,
          userId,
        });
        throw new Error("Conversation not found");
      }

      const message = await db.Message.create({
        conversation_id: conversationId,
        user_id: userId,
        query_text: messageData.queryText,
        document_ids: messageData.documentIds || [],
        ai_response: messageData.aiResponse || null,
        chunks_used: messageData.chunksUsed || 0,
        processing_time: messageData.processingTime || null,
        model_name: messageData.modelName || null,
        error: messageData.error || false,
        error_message: messageData.errorMessage || null,
      });

      // Update conversation's updated_at timestamp
      conversation.updated_at = new Date();
      await conversation.save();

      // Auto-generate title from first message if still default
      if (conversation.title === "New Conversation") {
        const generatedTitle = this.generateTitle(messageData.queryText);
        await conversation.updateTitle(generatedTitle);
        logger.debug("Auto-generated conversation title", {
          conversationId,
          generatedTitle,
        });
      }

      logger.info("Message created", {
        conversationId,
        userId,
        messageId: message.id,
        documentCount: (messageData.documentIds || []).length,
        hasError: messageData.error || false,
        // Never log queryText — it may contain sensitive document content
      });

      return {
        success: true,
        message: message,
        conversation: conversation,
      };
    } catch (error) {
      logger.error("Failed to create message", {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  // Update message with AI response
  async updateMessageWithResponse(messageId, userId, responseData) {
    try {
      const message = await db.Message.findOne({
        where: {
          id: messageId,
          user_id: userId,
        },
      });

      if (!message) {
        logger.warn("Message not found for response update", {
          messageId,
          userId,
        });
        throw new Error("Message not found");
      }

      await message.setAIResponse(responseData.aiResponse, {
        chunksUsed: responseData.chunksUsed,
        processingTime: responseData.processingTime,
        modelName: responseData.modelName,
      });

      // This is gold for Document AI cost tracking
      logger.info("AI response saved", {
        messageId,
        userId,
        chunksUsed: responseData.chunksUsed,
        processingTimeMs: responseData.processingTime,
        modelName: responseData.modelName,
      });

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      logger.error("Failed to update message with response", {
        messageId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  // Mark message as error
  async markMessageAsError(messageId, userId, errorMessage) {
    try {
      const message = await db.Message.findOne({
        where: {
          id: messageId,
          user_id: userId,
        },
      });

      if (!message) {
        logger.warn("Message not found to mark as error", {
          messageId,
          userId,
        });
        throw new Error("Message not found");
      }

      await message.markAsError(errorMessage);

      logger.warn("Message marked as error", {
        messageId,
        userId,
        errorMessage,
      });

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      logger.error("Failed to mark message as error", {
        messageId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to mark message as error: ${error.message}`);
    }
  }

  // Get messages for conversation
  async getConversationMessages(conversationId, userId, options = {}) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (!conversation) {
        logger.warn("Conversation not found for message fetch", {
          conversationId,
          userId,
        });
        throw new Error("Conversation not found");
      }

      const messages = await db.Message.findByConversation(
        conversationId,
        options,
      );

      logger.debug("Fetched conversation messages", {
        conversationId,
        userId,
        count: messages.length,
      });

      return {
        success: true,
        messages: messages,
        count: messages.length,
      };
    } catch (error) {
      logger.error("Failed to get messages", {
        conversationId,
        userId,
        error: error.message,
      });
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async getRecentMessages(conversationId, userId, limit = 5) {
    try {
      const messages = await db.Message.findAll({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        attributes: ["query_text", "ai_response", "created_at"],
        order: [["created_at", "DESC"]],
        limit: limit,
      });

      if (!messages || messages.length === 0) {
        logger.debug("No recent messages found", { conversationId, userId });
        return [];
      }

      const formattedHistory = [];

      messages.reverse().forEach((msg) => {
        if (msg.query_text) {
          formattedHistory.push({ role: "user", content: msg.query_text });
        }
        if (msg.ai_response) {
          formattedHistory.push({
            role: "assistant",
            content: msg.ai_response,
          });
        }
      });

      logger.debug("Retrieved recent messages for context", {
        conversationId,
        userId,
        messagesRetrieved: messages.length,
        formattedCount: formattedHistory.length,
      });

      return formattedHistory;
    } catch (error) {
      // Graceful fallback — log but don't crash the LLM pipeline
      logger.error("Failed to get recent messages, returning empty context", {
        conversationId,
        userId,
        error: error.message,
      });
      return [];
    }
  }

  // Helper: Generate conversation title from first query
  generateTitle(queryText) {
    const maxLength = 50;
    let title = queryText.trim();

    if (title.length > maxLength) {
      title = title.substring(0, maxLength).trim() + "...";
    }

    return title;
  }
}

module.exports = new ChatService();
