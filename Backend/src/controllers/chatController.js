// src/controllers/chatController.js
const chatService = require('../services/chatService');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

class ChatController {

  // Create new conversation
  async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const { title } = req.body;

      const result = await chatService.createConversation(userId, title);

      return successResponse(
        res,
        result.conversation,
        result.message,
        201
      );

    } catch (error) {
      console.error('Create conversation error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  // Get user's conversations
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const { limit, offset } = req.query;

      const options = {};
      
      if (limit) {
        options.limit = parseInt(limit);
      }
      
      if (offset) {
        options.offset = parseInt(offset);
      }

      const result = await chatService.getUserConversations(userId, options);

      return successResponse(
        res,
        {
          conversations: result.conversations,
          total: result.count
        },
        'Conversations retrieved successfully',
        200
      );

    } catch (error) {
      console.error('Get conversations error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  // Get conversation with messages
  async getConversation(req, res) {
    try {
      const conversationId = req.params.id;
      const userId = req.user.id;

      const result = await chatService.getConversationWithMessages(conversationId, userId);

      return successResponse(
        res,
        result.conversation,
        'Conversation retrieved successfully',
        200
      );

    } catch (error) {
      console.error('Get conversation error:', error);
      const statusCode = error.message === 'Conversation not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Update conversation title
  async updateConversation(req, res) {
    try {
      const conversationId = req.params.id;
      const userId = req.user.id;
      const { title } = req.body;

      if (!title || title.trim().length === 0) {
        return errorResponse(res, 'Title is required', 400);
      }

      const result = await chatService.updateConversationTitle(conversationId, userId, title);

      return successResponse(
        res,
        result.conversation,
        result.message,
        200
      );

    } catch (error) {
      console.error('Update conversation error:', error);
      const statusCode = error.message === 'Conversation not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Delete conversation
  async deleteConversation(req, res) {
    try {
      const conversationId = req.params.id;
      const userId = req.user.id;

      const result = await chatService.deleteConversation(conversationId, userId);

      return successResponse(
        res,
        null,
        result.message,
        200
      );

    } catch (error) {
      console.error('Delete conversation error:', error);
      const statusCode = error.message === 'Conversation not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Create message in conversation
  async createMessage(req, res) {
    try {
      const conversationId = req.params.id;
      const userId = req.user.id;
      const { queryText, documentIds } = req.body;

      if (!queryText || queryText.trim().length === 0) {
        return errorResponse(res, 'Query text is required', 400);
      }

      const messageData = {
        queryText: queryText.trim(),
        documentIds: documentIds || []
      };

      const result = await chatService.createMessage(conversationId, userId, messageData);

      return successResponse(
        res,
        {
          message: result.message,
          conversation: result.conversation
        },
        'Message created successfully',
        201
      );

    } catch (error) {
      console.error('Create message error:', error);
      const statusCode = error.message === 'Conversation not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Update message with AI response
  async updateMessage(req, res) {
    try {
      const messageId = req.params.messageId;
      const userId = req.user.id;
      const { aiResponse, chunksUsed, processingTime, modelName } = req.body;

      const responseData = {
        aiResponse,
        chunksUsed,
        processingTime,
        modelName
      };

      const result = await chatService.updateMessageWithResponse(messageId, userId, responseData);

      return successResponse(
        res,
        result.message,
        'Message updated successfully',
        200
      );

    } catch (error) {
      console.error('Update message error:', error);
      const statusCode = error.message === 'Message not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // Get messages for conversation
  async getMessages(req, res) {
    try {
      const conversationId = req.params.id;
      const userId = req.user.id;
      const { limit, offset } = req.query;

      const options = {};
      
      if (limit) {
        options.limit = parseInt(limit);
      }
      
      if (offset) {
        options.offset = parseInt(offset);
      }

      const result = await chatService.getConversationMessages(conversationId, userId, options);

      return successResponse(
        res,
        {
          messages: result.messages,
          total: result.count
        },
        'Messages retrieved successfully',
        200
      );

    } catch (error) {
      console.error('Get messages error:', error);
      const statusCode = error.message === 'Conversation not found' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new ChatController();
