const { ChromaClient } = require("chromadb");

class RetrievalService {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });
  }

  /**
   * Get collection for a specific document
   * @param {string} documentId - The document ID
   */
  async getDocumentCollection(documentId) {
    try {
      const collectionName = `doc_${documentId}_chunks`;
      const collection = await this.client.getCollection({
        name: collectionName,
      });
      return collection;
    } catch (error) {
      console.error(
        `Error getting collection for document ${documentId}:`,
        error
      );
      throw new Error(`Collection not found for document: ${documentId}`);
    }
  }

  /**
   * Retrieve relevant document chunks for a given query from specific document
   * @param {string} documentId - The document ID to query
   * @param {string} queryText - User's question
   * @param {number} nResults - Number of relevant chunks to retrieve
   * @returns {Object} Retrieved documents with metadata
   */
  async retrieveRelevantChunks(documentId, queryText, nResults = 5) {
    try {
      const collection = await this.getDocumentCollection(documentId);

      // Query ChromaDB using semantic similarity
      const results = await collection.query({
        queryTexts: [queryText],
        nResults: nResults,
        include: ["documents", "metadatas", "distances"],
      });

      // Format results for easier consumption
      const formattedResults = this.formatRetrievalResults(results);

      return {
        documentId: documentId,
        query: queryText,
        retrievedChunks: formattedResults,
        count: formattedResults.length,
      };
    } catch (error) {
      console.error("Error retrieving chunks:", error);
      throw new Error("Failed to retrieve relevant documents");
    }
  }

  /**
   * Retrieve from multiple documents at once
   * @param {Array} documentIds - Array of document IDs
   * @param {string} queryText - User's question
   * @param {number} nResults - Number of chunks per document
   * @returns {Object} Combined results from all documents
   */
  async retrieveFromMultipleDocuments(documentIds, queryText, nResults = 5) {
    try {
      const allResults = [];

      // Query each document collection
      for (const docId of documentIds) {
        try {
          const result = await this.retrieveRelevantChunks(
            docId,
            queryText,
            nResults
          );
          allResults.push(
            ...result.retrievedChunks.map((chunk) => ({
              ...chunk,
              documentId: docId,
            }))
          );
        } catch (error) {
          console.warn(`Skipping document ${docId}:`, error.message);
          continue;
        }
      }

      // Sort by relevance score and take top results
      const sortedResults = allResults
        .sort((a, b) => b.score - a.score)
        .slice(0, nResults);

      return {
        documentIds: documentIds,
        query: queryText,
        retrievedChunks: sortedResults,
        count: sortedResults.length,
      };
    } catch (error) {
      console.error("Error retrieving from multiple documents:", error);
      throw new Error("Failed to retrieve from multiple documents");
    }
  }

  /**
   * Format ChromaDB query results into structured format
   * @param {Object} results - Raw results from ChromaDB
   * @returns {Array} Formatted results
   */
  formatRetrievalResults(results) {
    const documents = results.documents[0] || [];
    const metadatas = results.metadatas[0] || [];
    const distances = results.distances[0] || [];

    return documents.map((doc, index) => {
      const metadata = metadatas[index] || {};

      // Parse navigation if it's stringified
      if (metadata.navigation && typeof metadata.navigation === "string") {
        try {
          metadata.navigation = JSON.parse(metadata.navigation);
        } catch (e) {
          console.warn("Failed to parse navigation metadata");
        }
      }

      return {
        content: doc,
        metadata: metadata,
        score: 1 - distances[index], // Convert distance to similarity score
        relevanceScore: distances[index],
        chunkIndex: metadata.chunkIndex,
        tokens: metadata.tokens,
      };
    });
  }

  /**
   * Filter chunks by relevance threshold
   * @param {Array} chunks - Retrieved chunks
   * @param {number} threshold - Minimum relevance score (0-1)
   * @returns {Array} Filtered chunks
   */
  filterByRelevance(chunks, threshold = 0.7) {
    return chunks.filter((chunk) => chunk.score >= threshold);
  }

  /**
   * Check if collection exists for a document
   * @param {string} documentId - Document ID
   * @returns {boolean} Whether collection exists
   */
  async collectionExists(documentId) {
    try {
      const collectionName = `doc_${documentId}_chunks`;
      await this.client.getCollection({ name: collectionName });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new RetrievalService();
