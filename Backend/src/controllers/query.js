const retrievalService = require("../services/retrieval-service");
const llmService = require("../services/llm-service");
const PromptBuilder = require("../utils/prompt-builder");

class QueryController {
  /**
   * Handle user query with RAG pipeline for a specific document
   */
  async handleQuery(req, res) {
    try {
      const { documentId, question, options = {} } = req.body;

      // Validate input
      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Question is required",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
      }

      // Check if collection exists for this document
      const exists = await retrievalService.collectionExists(documentId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: `No processed document found with ID: ${documentId}`,
        });
      }

      // Step 1: Retrieve relevant chunks from ChromaDB
      const retrievalResult = await retrievalService.retrieveRelevantChunks(
        documentId,
        question,
        options.nResults || 5
      );

      // Optional: Filter by relevance threshold
      const relevantChunks = options.filterByRelevance
        ? retrievalService.filterByRelevance(
            retrievalResult.retrievedChunks,
            options.relevanceThreshold || 0.7
          )
        : retrievalResult.retrievedChunks;

      // Check if we have relevant context
      if (relevantChunks.length === 0) {
        return res.status(200).json({
          success: true,
          answer:
            "I could not find relevant information in this document to answer your question.",
          sources: [],
          retrievedChunks: 0,
        });
      }

      // Step 2: Build prompt with retrieved context
      const prompt = PromptBuilder.buildRAGPrompt(question, relevantChunks, {
        includeMetadata: options.includeMetadata !== false,
        maxContextLength: options.maxContextLength || 4000,
        instructionTemplate: options.instructionTemplate || "default",
      });

      // Step 3: Generate answer using LLM
      const llmResponse = await llmService.generateAnswer(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
      });

      // Step 4: Format and return response
      const sources = PromptBuilder.formatSourceCitations(relevantChunks);

      return res.status(200).json({
        success: true,
        answer: llmResponse.answer,
        sources: sources,
        metadata: {
          documentId: documentId,
          retrievedChunks: relevantChunks.length,
          model: llmResponse.model,
          provider: llmResponse.provider,
          tokensUsed: llmResponse.tokensUsed,
        },
      });
    } catch (error) {
      console.error("Error handling query:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to process query",
        message: error.message,
      });
    }
  }

  /**
   * Handle query across multiple documents
   */
  async handleMultiDocumentQuery(req, res) {
    try {
      const { documentIds, question, options = {} } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Question is required",
        });
      }

      if (
        !documentIds ||
        !Array.isArray(documentIds) ||
        documentIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "At least one document ID is required",
        });
      }

      // Retrieve from multiple documents
      const retrievalResult =
        await retrievalService.retrieveFromMultipleDocuments(
          documentIds,
          question,
          options.nResults || 5
        );

      const relevantChunks = retrievalResult.retrievedChunks;

      if (relevantChunks.length === 0) {
        return res.status(200).json({
          success: true,
          answer:
            "I could not find relevant information in the provided documents to answer your question.",
          sources: [],
          retrievedChunks: 0,
        });
      }

      // Build prompt
      const prompt = PromptBuilder.buildRAGPrompt(
        question,
        relevantChunks,
        options
      );

      // Generate answer
      const llmResponse = await llmService.generateAnswer(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
      });

      const sources = PromptBuilder.formatSourceCitations(relevantChunks);

      return res.status(200).json({
        success: true,
        answer: llmResponse.answer,
        sources: sources,
        metadata: {
          documentIds: documentIds,
          retrievedChunks: relevantChunks.length,
          model: llmResponse.model,
          provider: llmResponse.provider,
          tokensUsed: llmResponse.tokensUsed,
        },
      });
    } catch (error) {
      console.error("Error handling multi-document query:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to process multi-document query",
        message: error.message,
      });
    }
  }

  /**
   * Handle conversational query with chat history
   */
  async handleConversationalQuery(req, res) {
    try {
      const { documentId, question, chatHistory = [], options = {} } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Question is required",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
      }

      // Retrieve relevant chunks
      const retrievalResult = await retrievalService.retrieveRelevantChunks(
        documentId,
        question,
        options.nResults || 5
      );

      const relevantChunks = retrievalResult.retrievedChunks;

      if (relevantChunks.length === 0) {
        return res.status(200).json({
          success: true,
          answer:
            "I could not find relevant information in this document to answer your question.",
          sources: [],
          retrievedChunks: 0,
        });
      }

      // Build conversational prompt with history
      const prompt = PromptBuilder.buildConversationalPrompt(
        question,
        relevantChunks,
        chatHistory,
        options
      );

      // Generate answer
      const llmResponse = await llmService.generateAnswer(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
      });

      const sources = PromptBuilder.formatSourceCitations(relevantChunks);

      return res.status(200).json({
        success: true,
        answer: llmResponse.answer,
        sources: sources,
        metadata: {
          documentId: documentId,
          retrievedChunks: relevantChunks.length,
          model: llmResponse.model,
          provider: llmResponse.provider,
          tokensUsed: llmResponse.tokensUsed,
        },
      });
    } catch (error) {
      console.error("Error handling conversational query:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to process conversational query",
        message: error.message,
      });
    }
  }
}

module.exports = new QueryController();
