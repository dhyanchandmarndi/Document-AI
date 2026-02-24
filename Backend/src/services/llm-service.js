const { GoogleGenerativeAI } = require("@google/generative-ai");
const LocalLLMService = require("./local-llm.service");
const PromptBuilder = require("../utils/prompt-builder");
const logger = require("../config/logger");

// Cloud model registry — add new cloud models here as needed
const CLOUD_MODELS = {
  "gemini-3-flash-preview": "gemini-3-flash-preview",
};

const DEFAULT_CLOUD_MODEL = "gemini-3-flash-preview";

class LLMService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  getCloudModel(modelId) {
    const resolvedModel = CLOUD_MODELS[modelId] || DEFAULT_CLOUD_MODEL;
    return this.genAI.getGenerativeModel({ model: resolvedModel });
  }

  async generateResponse(query, chunks, options = {}) {
    const {
      instructionTemplate = "default",
      maxContextLength = 8000,
      temperature = 0.7,
      maxOutputTokens = 8192,
      chatHistory = [],
      provider = "cloud",
      model = null,
    } = options;

    const startTime = Date.now();

    if (!chunks || !Array.isArray(chunks)) {
      throw new Error(`Invalid chunks data: ${typeof chunks}`);
    }

    const validChunks = chunks.filter(
      (chunk) => chunk && (chunk.text || chunk.content),
    );

    if (validChunks.length === 0) {
      throw new Error("No valid chunks available for AI generation");
    }

    const isConversational = chatHistory && chatHistory.length > 0;

    const prompt = isConversational
      ? PromptBuilder.buildConversationalPrompt(
          query,
          validChunks,
          chatHistory,
          {
            includeMetadata: true,
            maxContextLength,
            instructionTemplate,
          },
        )
      : PromptBuilder.buildRAGPrompt(query, validChunks, {
          includeMetadata: true,
          maxContextLength,
          instructionTemplate,
        });

    logger.debug("LLM request prepared", {
      provider,
      model:
        model || (provider === "local" ? "gemma2:2b" : DEFAULT_CLOUD_MODEL),
      totalChunks: chunks.length,
      validChunks: validChunks.length,
      invalidChunks: chunks.length - validChunks.length,
      isConversational,
      chatHistoryLength: chatHistory.length,
      instructionTemplate,
      temperature,
      maxOutputTokens,
    });

    // LOCAL path
    if (provider === "local") {
      const ollamaModel = model || "gemma2:2b";

      try {
        const answer = await LocalLLMService.generateLocalResponse(
          prompt,
          ollamaModel,
        );
        const latencyMs = Date.now() - startTime;

        logger.info("Local LLM response generated", {
          provider: "local",
          model: ollamaModel,
          sourcesUsed: validChunks.length,
          latencyMs,
        });

        return { answer, model: ollamaModel, sourcesUsed: validChunks.length };
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        logger.error("Local LLM generation failed", {
          provider: "local",
          model: ollamaModel,
          error: error.message,
          latencyMs,
        });
        throw new Error(
          `Failed to generate local AI response: ${error.message}`,
        );
      }
    }

    // CLOUD path
    const cloudModelId = model || DEFAULT_CLOUD_MODEL;
    const geminiModel = this.getCloudModel(cloudModelId);

    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topK: 40,
          topP: 0.95,
        },
      });

      const latencyMs = Date.now() - startTime;

      // Most important log in the entire codebase for cost tracking
      logger.info("Cloud LLM response generated", {
        provider: "cloud",
        model: cloudModelId,
        sourcesUsed: validChunks.length,
        latencyMs,
        temperature,
        maxOutputTokens,
      });

      return {
        answer: result.response.text(),
        model: cloudModelId,
        sourcesUsed: validChunks.length,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      logger.error("Cloud LLM generation failed", {
        provider: "cloud",
        model: cloudModelId,
        error: error.message,
        latencyMs, // know if it was a timeout vs instant rejection
      });

      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
