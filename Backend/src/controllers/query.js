// src/controllers/queryController.js
const queryService = require('../services/query-service');
const LLMService = require('../services/llm-service');
const chatService = require('../services/chatService');

class QueryController {
  async processQuery(req, res) {
    try {
      const userId = req.user.id;
      const { query, documentIds, useAI = false, conversationId } = req.body;

      console.log(`Processing query for user ${userId}: "${query}"`);

      const startTime = Date.now();

      let messageId = null;

      // Step 1: Create message in conversation if conversationId provided
      if (conversationId) {
        try {
          const messageResult = await chatService.createMessage(conversationId, userId, {
            queryText: query,
            documentIds: documentIds || []
          });
          messageId = messageResult.message.id;
          console.log(`Message created in conversation: ${messageId}`);
        } catch (error) {
          console.error('Failed to save message to conversation:', error);
          // Continue processing even if saving fails
        }
      }

      // Step 2: Get relevant chunks
      const retrievalResults = await queryService.executeQuery(userId, query, documentIds);

      let aiResponse = null;
      if (useAI && retrievalResults.chunks && retrievalResults.chunks.length > 0) {
        console.log('Generating AI response...');
        aiResponse = await LLMService.generateResponse(
          query, 
          retrievalResults.chunks,
          { instructionTemplate: "default" }
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
        } : null
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
