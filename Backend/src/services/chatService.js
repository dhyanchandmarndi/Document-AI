// src/services/chatService.js
const { db } = require('../models');

class ChatService {
  
  // Create new conversation
  async createConversation(userId, title = 'New Conversation') {
    try {
      const conversation = await db.Conversation.create({
        user_id: userId,
        title: title
      });

      return {
        success: true,
        conversation: conversation,
        message: 'Conversation created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  // Get user's conversations
  async getUserConversations(userId, options = {}) {
    try {
      const conversations = await db.Conversation.findByUser(userId, {
        include: [{
          model: db.Message,
          as: 'messages',
          attributes: ['id', 'query_text', 'created_at'],
          limit: 1,
          order: [['created_at', 'DESC']]
        }],
        ...options
      });

      return {
        success: true,
        conversations: conversations,
        count: conversations.length
      };
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  // Get conversation with messages
  async getConversationWithMessages(conversationId, userId) {
    try {
      const conversation = await db.Conversation.findOne({
        where: { 
          id: conversationId,
          user_id: userId
        },
        include: [{
          model: db.Message,
          as: 'messages',
          attributes: [
            'id', 
            'query_text', 
            'ai_response', 
            'document_ids', 
            'chunks_used', 
            'processing_time', 
            'model_name', 
            'error', 
            'error_message', 
            'created_at'
          ]
        }],
        order: [
          [{ model: db.Message, as: 'messages' }, 'created_at', 'ASC']
        ]
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // ADD: Fetch document details for each message
    const conversationData = conversation.toJSON();
    
    // Get all unique document IDs from all messages
    const allDocumentIds = new Set();
    conversationData.messages.forEach(msg => {
      if (msg.document_ids && Array.isArray(msg.document_ids)) {
        msg.document_ids.forEach(id => allDocumentIds.add(id));
      }
    });

    // Fetch all documents at once (efficient)
    let documentsMap = {};
    if (allDocumentIds.size > 0) {
      const documents = await db.Document.findAll({
        where: {
          id: Array.from(allDocumentIds),
          user_id: userId
        },
        attributes: ['id', 'original_filename', 'total_pages', 'chunk_count']
      });

      // Create a map for quick lookup
      documents.forEach(doc => {
        documentsMap[doc.id] = {
          id: doc.id,
          name: doc.original_filename,
          pages: doc.total_pages,
          chunks: doc.chunk_count
        };
      });
    }

    // Attach document details to each message
    conversationData.messages = conversationData.messages.map(msg => ({
      ...msg,
      documents: msg.document_ids 
        ? msg.document_ids.map(id => documentsMap[id]).filter(Boolean)
        : []
    }));

    return {
      success: true,
      conversation: conversationData
    };
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  // Update conversation title
  async updateConversationTitle(conversationId, userId, title) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      await conversation.updateTitle(title);

      return {
        success: true,
        conversation: conversation,
        message: 'Conversation title updated'
      };
    } catch (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }
  }

  // Delete conversation
  async deleteConversation(conversationId, userId) {
    try {
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      await conversation.destroy();

      return {
        success: true,
        message: 'Conversation deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Create message in conversation
  async createMessage(conversationId, userId, messageData) {
    try {
      // Verify conversation belongs to user
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
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
        error_message: messageData.errorMessage || null
      });

      // Update conversation's updated_at timestamp
      conversation.updated_at = new Date();
      await conversation.save();

      // Auto-generate title from first message if still default
      if (conversation.title === 'New Conversation') {
        const generatedTitle = this.generateTitle(messageData.queryText);
        await conversation.updateTitle(generatedTitle);
      }

      return {
        success: true,
        message: message,
        conversation: conversation
      };
    } catch (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  // Update message with AI response
  async updateMessageWithResponse(messageId, userId, responseData) {
    try {
      const message = await db.Message.findOne({
        where: {
          id: messageId,
          user_id: userId
        }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      await message.setAIResponse(responseData.aiResponse, {
        chunksUsed: responseData.chunksUsed,
        processingTime: responseData.processingTime,
        modelName: responseData.modelName
      });

      return {
        success: true,
        message: message
      };
    } catch (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  // Mark message as error
  async markMessageAsError(messageId, userId, errorMessage) {
    try {
      const message = await db.Message.findOne({
        where: {
          id: messageId,
          user_id: userId
        }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      await message.markAsError(errorMessage);

      return {
        success: true,
        message: message
      };
    } catch (error) {
      throw new Error(`Failed to mark message as error: ${error.message}`);
    }
  }

  // Get messages for conversation
  async getConversationMessages(conversationId, userId, options = {}) {
    try {
      // Verify conversation belongs to user
      const conversation = await db.Conversation.findOne({
        where: {
          id: conversationId,
          user_id: userId
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = await db.Message.findByConversation(conversationId, options);

      return {
        success: true,
        messages: messages,
        count: messages.length
      };
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }
  async getRecentMessages(conversationId, userId, limit = 5) {
    try {
      // Fetch recent messages from database
      const messages = await db.Message.findAll({
        where: {
          conversation_id: conversationId,
          user_id: userId
        },
        attributes: ['query_text', 'ai_response', 'created_at'],
        order: [['created_at', 'DESC']], // Most recent first
        limit: limit
      });

      if (!messages || messages.length === 0) {
        return [];
      }

      // Format chat history (reverse to get chronological order)
      const formattedHistory = [];
      
      // Reverse to get oldest first (chronological order)
      messages.reverse().forEach(msg => {
        // Add user message
        if (msg.query_text) {
          formattedHistory.push({
            role: 'user',
            content: msg.query_text
          });
        }
        
        // Add assistant response
        if (msg.ai_response) {
          formattedHistory.push({
            role: 'assistant',
            content: msg.ai_response
          });
        }
      });

      console.log(`Retrieved ${formattedHistory.length} messages for conversation context`);
      return formattedHistory;

    } catch (error) {
      console.error('Error getting recent messages:', error);
      return []; // Return empty array on error (graceful fallback)
    }
  }

  // Helper: Generate conversation title from first query
  generateTitle(queryText) {
    const maxLength = 50;
    let title = queryText.trim();
    
    if (title.length > maxLength) {
      title = title.substring(0, maxLength).trim() + '...';
    }
    
    return title;
  }
}

module.exports = new ChatService();
