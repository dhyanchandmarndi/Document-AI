// src/services/queryService.js
const { db } = require('../models');
const ChromaHelper = require('../utils/chromaHelper');

const chromaHelper = new ChromaHelper();

class QueryService {
  async executeQuery(userId, queryText, documentIds = null) {
    try {
      console.log(`Executing query for user ${userId}`);
      
      // Get user's ChromaDB collection
      const collectionName = `user_${userId}_documents`;
      
      // Query ChromaDB for relevant chunks
      console.log(`Querying ChromaDB collection: ${collectionName}`);
      const chromaResults = await chromaHelper.queryCollection(collectionName, queryText, {
        documentIds: documentIds,
        nResults: 5
      });

      // Process results
      const processedResults = await this.processQueryResults(chromaResults, userId);

      console.log(`Found ${processedResults.totalResults} relevant chunks`);

      return processedResults;

    } catch (error) {
      console.error('Query execution error:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async processQueryResults(chromaResults, userId) {
    try {
      if (!chromaResults || !chromaResults.documents || !chromaResults.documents[0]) {
        console.log('No results returned from ChromaDB');
        return {
          chunks: [],
          sources: [],
          totalResults: 0
        };
      }

      const documents = chromaResults.documents[0];
      
      if (!documents || documents.length === 0) {
        console.log('Empty documents array from ChromaDB');
        return {
          chunks: [],
          sources: [],
          totalResults: 0
        };
      }

      const metadatas = chromaResults.metadatas[0];
      const distances = chromaResults.distances[0];

      // Process chunks
      const chunks = documents.map((text, index) => ({
        text: text,
        similarity: Math.round((1 - distances[index]) * 100) / 100,
        documentId: metadatas[index].documentId,
        filename: metadatas[index].filename,
        chunkIndex: metadatas[index].chunkIndex,
        tokens: metadatas[index].tokens
      }));

      // Get unique sources
      const uniqueDocIds = [...new Set(chunks.map(chunk => chunk.documentId))];
      const sources = uniqueDocIds.map(docId => {
        const chunksFromDoc = chunks.filter(chunk => chunk.documentId === docId);
        return {
          documentId: docId,
          filename: chunksFromDoc[0].filename,
          chunksFound: chunksFromDoc.length
        };
      });

      return {
        chunks: chunks,
        sources: sources,
        totalResults: chunks.length
      };

    } catch (error) {
      console.error('Process query results error:', error);
      throw new Error(`Failed to process query results: ${error.message}`);
    }
  }
}

module.exports = new QueryService();
