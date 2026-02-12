// src/services/LLMService.js using Google Gemini API
const { GoogleGenerativeAI } = require("@google/generative-ai");
const LocalLLMService = require("./local-llm.service");
const PromptBuilder = require("../utils/prompt-builder");

class LLMService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Updated model → Gemini Flash 3 Preview
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });
  }

  async generateResponse(query, chunks, options = {}) {
    try {
      const {
        instructionTemplate = "default",
        maxContextLength = 8000,
        temperature = 0.7,
        maxOutputTokens = 8192,
        chatHistory = [],
        provider = "cloud", // NEW
      } = options;

      if (!chunks || !Array.isArray(chunks)) {
        throw new Error(`Invalid chunks data: ${typeof chunks}`);
      }

      const validChunks = chunks.filter((chunk) => {
        if (!chunk) return false;
        if (!chunk.text && !chunk.content) return false;
        return true;
      });

      if (validChunks.length === 0) {
        throw new Error("No valid chunks available for AI generation");
      }

      let prompt;

      if (chatHistory && chatHistory.length > 0) {
        prompt = PromptBuilder.buildConversationalPrompt(
          query,
          validChunks,
          chatHistory,
          {
            includeMetadata: true,
            maxContextLength,
            instructionTemplate,
          },
        );
      } else {
        prompt = PromptBuilder.buildRAGPrompt(query, validChunks, {
          includeMetadata: true,
          maxContextLength,
          instructionTemplate,
        });
      }

      // LOCAL MODEL PATH
      if (provider === "local") {
        const answer = await LocalLLMService.generateLocalResponse(prompt);

        return {
          answer,
          model: "gemma2:2b (ollama)",
          sourcesUsed: validChunks.length,
        };
      }

      // CLOUD MODEL PATH (Gemini)
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topK: 40,
          topP: 0.95,
        },
      });

      const answer = result.response.text();

      return {
        answer,
        model: "gemini-3-flash-preview",
      };
    } catch (error) {
      console.error("LLM generation error:", error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
