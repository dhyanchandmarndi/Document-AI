// src/controllers/queryController.js
const queryService = require('../services/query-service');
const LLMService = require('../services/llm-service');
const chatService = require('../services/chatService');
const contextResolutionService = require('../services/contextResolutionService');

class QueryController {
  async processQuery(req, res) {
    try {
      const userId = req.user.id;
      const { query, documentIds, useAI = false, conversationId } = req.body;

      console.log(`Processing query for user ${userId}: "${query}"`);

      const startTime = Date.now();

      let messageId = null;

      const contextResolution = await contextResolutionService.resolveDocumentContext(
        userId,
        query,
        documentIds,
        conversationId
      );

      const resolvedDocumentIds = contextResolution.documentIds;
      console.log('Context resolution:', contextResolution);

      let chatHistory = [];
      if (conversationId) {
        try {
          chatHistory = await chatService.getRecentMessages(conversationId, userId, 5);
          console.log(`Chat history: ${chatHistory.length} messages loaded`);
        } catch (error) {
          console.error('Failed to load chat history:', error);
          // Continue without history on error
        }
      }

      // Step 1: Create message in conversation if conversationId provided
      if (conversationId) {
        try {
          const messageResult = await chatService.createMessage(conversationId, userId, {
            queryText: query,
            documentIds: resolvedDocumentIds
          });
          messageId = messageResult.message.id;
          console.log(`Message created in conversation: ${messageId}`);
        } catch (error) {
          console.error('Failed to save message to conversation:', error);
        }
      }

      if (resolvedDocumentIds.length === 0) {
        console.log('No documents available - handling general query');
        
        let response;
        
        if (useAI) {
          // Option A: Return helpful message
          response = {
            success: true,
            query: query,
            answer: "I don't have any documents to reference for this question. Please upload a document first, or your question will be answered based on general knowledge without document context.",
            retrieval: {
              chunks: [],
              sources: [],
              totalResults: 0,
              processingTime: 0
            },
            ai: {
              model: 'system',
              sourcesUsed: 0
            },
            contextInfo: {
              ...contextResolution,
              message: 'No documents available in context'
            }
          };
        } else {
          response = {
            success: false,
            message: 'No documents available. Please upload a document or reference a previous one.',
            contextInfo: contextResolution
          };
        }

        return res.json(response);
      }

      // Step 2: Get relevant chunks
      const retrievalResults = await queryService.executeQuery(userId, query, resolvedDocumentIds);

      let aiResponse = null;
      if (useAI && retrievalResults.chunks && retrievalResults.chunks.length > 0) {
        console.log('Generating AI response...');
        aiResponse = await LLMService.generateResponse(
          query, 
          retrievalResults.chunks,
          { instructionTemplate: "default", chatHistory: chatHistory }
        );
        console.log('AI Answer:', aiResponse.answer);

        // Step 3: Update message with AI response if it was saved
        if (messageId) {
          try {
            await chatService.updateMessageWithResponse(messageId, userId, {
              aiResponse: aiResponse.answer,
              chunksUsed: retrievalResults.chunks.length,
              processingTime: (Date.now() - startTime) / 1000,
              modelName: aiResponse.model
            });
            console.log(`Message updated with AI response: ${messageId}`);
          } catch (error) {
            console.error('Failed to update message with response:', error);
            // Continue even if update fails
          }
        }
      } else if (useAI && retrievalResults.chunks.length === 0) {
        console.log('No chunks available for AI generation');
        if (messageId) {
          try {
            await chatService.markMessageAsError(messageId, userId, 'No relevant chunks found');
          } catch (error) {
            console.error('Failed to mark message as error:', error);
          }
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      console.log(`Query completed in ${processingTime}s`);

      // Return response
      res.json({
        success: true,
        query: query,
        answer: aiResponse?.answer || null,
        messageId: messageId, 
        conversationId: conversationId,
        retrieval: {
          ...retrievalResults,
          processingTime: processingTime
        },
        ai: aiResponse ? {
          model: aiResponse.model,
          // response: aiResponse.answer || "No response",
          sourcesUsed: aiResponse.sourcesUsed
        } : null,
        contextInfo: contextResolution,
        chatHistoryUsed: chatHistory.length
      });

    } catch (error) {
      console.error('Query processing error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to process query',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new QueryController();
