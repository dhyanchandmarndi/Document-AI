const { ChromaClient } = require("chromadb");

class QueryService {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMADB_URL || "http://localhost:8000",
    });
    this.collectionName = process.env.CHROMA_COLLECTION_NAME || "documents";
  }

  /**
   * Retrieve relevant document chunks based on user query
   * @param {string} query - User's question
   * @param {number} topK - Number of relevant chunks to retrieve
   * @returns {Array} - Array of relevant document chunks with metadata
   */
  async retrieveRelevantChunks(query, topK = 5) {
    try {
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      // Perform similarity search using ChromaDB's default embedding
      const results = await collection.query({
        queryTexts: [query],
        nResults: topK,
      });

      // Format results for easier consumption
      const relevantChunks = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index],
        id: results.ids[0][index],
      }));

      return relevantChunks;
    } catch (error) {
      console.error("Error retrieving chunks:", error);
      throw new Error(
        "Failed to retrieve relevant chunks from vector database"
      );
    }
  }

  /**
   * Filter chunks by similarity threshold
   * @param {Array} chunks - Retrieved chunks
   * @param {number} threshold - Minimum similarity score (lower distance = higher similarity)
   * @returns {Array} - Filtered chunks
   */
  filterByThreshold(chunks, threshold = 0.7) {
    // ChromaDB returns distances (lower is better)
    // Convert to similarity score if needed
    return chunks.filter((chunk) => chunk.distance <= threshold);
  }

  /**
   * Build context from retrieved chunks
   * @param {Array} chunks - Relevant document chunks
   * @returns {string} - Formatted context string
   */
  buildContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return "";
    }

    const contextParts = chunks.map((chunk, index) => {
      const metadata = chunk.metadata || {};
      const source = metadata.filename || metadata.source || "Unknown";
      const page = metadata.page ? ` (Page ${metadata.page})` : "";

      return `[Source ${index + 1}: ${source}${page}]\n${chunk.content}`;
    });

    return contextParts.join("\n\n---\n\n");
  }

  /**
   * Retrieve chunks by document ID
   * @param {string} documentId - Document identifier
   * @returns {Array} - All chunks for the document
   */
  async getChunksByDocumentId(documentId) {
    try {
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      const results = await collection.get({
        where: { documentId: documentId },
      });

      return results.documents.map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[index],
        id: results.ids[index],
      }));
    } catch (error) {
      console.error("Error retrieving chunks by document ID:", error);
      throw new Error("Failed to retrieve chunks for document");
    }
  }
}

module.exports = new QueryService();
