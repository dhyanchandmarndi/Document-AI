const { GoogleGenerativeAI } = require("@google/generative-ai");
const LocalLLMService = require("./local-llm.service");
const PromptBuilder = require("../utils/prompt-builder");

// Cloud model registry — add new cloud models here as needed
const CLOUD_MODELS = {
  // "gemini-2.0-flash": "gemini-2.0-flash",
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

  // Get a Gemini model instance dynamically instead of hardcoding in constructor
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
      model = null, // specific model ID from frontend
    } = options;

    if (!chunks || !Array.isArray(chunks)) {
      throw new Error(`Invalid chunks data: ${typeof chunks}`);
    }

    const validChunks = chunks.filter(
      (chunk) => chunk && (chunk.text || chunk.content),
    );

    if (validChunks.length === 0) {
      throw new Error("No valid chunks available for AI generation");
    }

    // Build prompt — same logic as before
    const prompt =
      chatHistory && chatHistory.length > 0
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

    // LOCAL path — pass the specific model name to Ollama
    if (provider === "local") {
      const ollamaModel = model || "gemma2:2b"; // fallback if none selected
      const answer = await LocalLLMService.generateLocalResponse(
        prompt,
        ollamaModel,
      );
      return {
        answer,
        model: ollamaModel,
        sourcesUsed: validChunks.length,
      };
    }

    // CLOUD path — resolve which Gemini model to use
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

      return {
        answer: result.response.text(),
        model: cloudModelId,
        sourcesUsed: validChunks.length,
      };
    } catch (error) {
      console.error("LLM generation error:", error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
