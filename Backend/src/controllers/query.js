// src/controllers/queryController.js
const queryService = require('../services/query-service');

class QueryController {
  async processQuery(req, res) {
    try {
      const userId = req.user.id;
      const { query, documentIds } = req.body;

      console.log(`Processing query for user ${userId}: "${query}"`);

      const startTime = Date.now();

      // Execute query
      const results = await queryService.executeQuery(userId, query, documentIds);

      const processingTime = (Date.now() - startTime) / 1000;

      console.log(`Query completed in ${processingTime}s - Found ${results.totalResults} results`);

      // Return response
      res.json({
        success: true,
        query: query,
        results: {
          ...results,
          processingTime: processingTime
        }
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
