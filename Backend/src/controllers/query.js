// src/controllers/queryController.js
const queryService = require('../services/query-service');
const LLMService = require('../services/llm-service');

class QueryController {
  async processQuery(req, res) {
    try {
      const userId = req.user.id;
      const { query, documentIds, useAI = false } = req.body;

      console.log(`Processing query for user ${userId}: "${query}"`);

      const startTime = Date.now();

      // Step 1: Get relevant chunks
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
      } else if (useAI && retrievalResults.chunks.length === 0) {
        console.log('No chunks available for AI generation');
      }

      const processingTime = (Date.now() - startTime) / 1000;

      console.log(`Query completed in ${processingTime}s`);

      // Return response
      res.json({
        success: true,
        query: query,
        answer: aiResponse?.answer || null,
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
