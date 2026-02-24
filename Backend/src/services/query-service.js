// src/services/queryService.js
const { db } = require("../models");
const ChromaHelper = require("../utils/chromaHelper");
const logger = require("../config/logger");

const chromaHelper = new ChromaHelper();

class QueryService {
  async executeQuery(userId, queryText, documentIds = null) {
    const startTime = Date.now();

    try {
      const collectionName = `user_${userId}_documents`;

      logger.debug("Executing ChromaDB query", {
        userId,
        collectionName,
        documentIds: documentIds ?? "all",
        // Never log queryText — it contains user's document content
      });

      const chromaResults = await chromaHelper.queryCollection(
        collectionName,
        queryText,
        {
          documentIds: documentIds,
          nResults: 5,
        },
      );

      const processedResults = await this.processQueryResults(
        chromaResults,
        userId,
      );
      const latencyMs = Date.now() - startTime;

      logger.info("Query executed successfully", {
        userId,
        collectionName,
        totalChunksFound: processedResults.totalResults,
        uniqueSources: processedResults.sources.length,
        latencyMs,
      });

      return processedResults;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      logger.error("Query execution failed", {
        userId,
        error: error.message,
        latencyMs,
      });

      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async processQueryResults(chromaResults, userId) {
    try {
      if (
        !chromaResults ||
        !chromaResults.documents ||
        !chromaResults.documents[0]
      ) {
        logger.warn("No results returned from ChromaDB", { userId });
        return { chunks: [], sources: [], totalResults: 0 };
      }

      const documents = chromaResults.documents[0];

      if (!documents || documents.length === 0) {
        logger.warn("Empty documents array from ChromaDB", { userId });
        return { chunks: [], sources: [], totalResults: 0 };
      }

      const metadatas = chromaResults.metadatas[0];
      const distances = chromaResults.distances[0];

      const chunks = documents.map((text, index) => ({
        text: text,
        similarity: Math.round((1 - distances[index]) * 100) / 100,
        documentId: metadatas[index].documentId,
        filename: metadatas[index].filename,
        chunkIndex: metadatas[index].chunkIndex,
        tokens: metadatas[index].tokens,
      }));

      const uniqueDocIds = [
        ...new Set(chunks.map((chunk) => chunk.documentId)),
      ];
      const sources = uniqueDocIds.map((docId) => {
        const chunksFromDoc = chunks.filter(
          (chunk) => chunk.documentId === docId,
        );
        return {
          documentId: docId,
          filename: chunksFromDoc[0].filename,
          chunksFound: chunksFromDoc.length,
        };
      });

      // Useful for spotting low-quality retrievals — if avg similarity is low,
      // your chunking strategy or embeddings may need tuning
      const avgSimilarity = chunks.length
        ? Math.round(
            (chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length) *
              100,
          ) / 100
        : 0;

      logger.debug("Query results processed", {
        userId,
        totalChunks: chunks.length,
        uniqueDocuments: uniqueDocIds.length,
        avgSimilarity,
        minSimilarity: chunks.length
          ? Math.min(...chunks.map((c) => c.similarity))
          : null,
        maxSimilarity: chunks.length
          ? Math.max(...chunks.map((c) => c.similarity))
          : null,
      });

      return { chunks, sources, totalResults: chunks.length };
    } catch (error) {
      logger.error("Failed to process ChromaDB query results", {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to process query results: ${error.message}`);
    }
  }
}

module.exports = new QueryService();
