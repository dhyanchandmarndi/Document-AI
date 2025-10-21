const { ChromaClient } = require("chromadb");

class ChromaHelper {
  constructor() {
    this.client = new ChromaClient({
      path: "http://localhost:8000",
    });
  }

  async storeInChromaDB(collectionName, chunksData) {
    try {
      // Get or create collection with default embedding function
      const collection = await this.client.getOrCreateCollection({
        name: collectionName,
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: undefined
      });

      // Prepare data - ChromaDB will generate embeddings automatically
      const ids = chunksData.map((item) => item.id);
      const documents = chunksData.map((item) => item.text);
      const metadatas = chunksData.map((item) => ({
        chunkIndex: item.chunkIndex,
        tokens: item.tokens,
        originalIndex: item.metadata?.originalIndex,
        isSplit: item.metadata?.isSplit || false,
        isCombined: item.metadata?.isCombined || false,
        ...item.globalMetadata,
        navigation: JSON.stringify(item.navigation),
      }));

      // Add to collection - ChromaDB generates embeddings
      await collection.add({
        ids: ids,
        documents: documents,
        metadatas: metadatas,
      });

      console.log(
        `Successfully stored ${ids.length} chunks in collection ${collectionName}`
      );

      return { success: true, count: ids.length };
    } catch (error) {
      console.error("ChromaDB storage error:", error);
      throw new Error(`Failed to store in ChromaDB: ${error.message}`);
    }
  }

  // Query method
  async queryCollection(collectionName, queryText, options = {}) {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: undefined
      });

      const queryParams = {
        queryTexts: [queryText],
        nResults: options.nResults || 5,
      };
      if (options.documentIds && options.documentIds.length > 0) {
        queryParams.where = {
          documentId: { $in: options.documentIds }
        };
      }

      const results = await collection.query(queryParams);
      return results;
    } catch (error) {
      console.error("ChromaDB query error:", error);
      throw new Error(`Failed to query ChromaDB: ${error.message}`);
    }
  }
}

module.exports = ChromaHelper;
