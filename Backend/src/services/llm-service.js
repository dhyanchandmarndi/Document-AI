// src/services/LLMService.js using Google Gemini API
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PromptBuilder = require("../utils/prompt-builder");

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async generateResponse(query, chunks, options = {}) {
    try {
      const {
        instructionTemplate = "default",
        maxContextLength = 8000,
        temperature = 0.7,
        maxOutputTokens = 8192
      } = options;

      console.log(`Generating AI response for query: "${query}"`);
      
      if (!chunks || !Array.isArray(chunks)) {
        throw new Error(`Invalid chunks data: ${typeof chunks}`);
      }

      console.log(`Received ${chunks.length} chunks`);
      
      if (chunks.length > 0) {
        console.log("First chunk:", JSON.stringify(chunks[0], null, 2));
      }

      const validChunks = chunks.filter(chunk => {
        if (!chunk) {
          console.warn("Found null/undefined chunk, skipping");
          return false;
        }
        if (!chunk.text && !chunk.content) {
          console.warn("Found chunk without text/content, skipping");
          return false;
        }
        return true;
      });

      console.log(`Using ${validChunks.length} valid chunks`);

      if (validChunks.length === 0) {
        throw new Error("No valid chunks available for AI generation");
      }

      // Build prompt using PromptBuilder
      const prompt = PromptBuilder.buildRAGPrompt(query, validChunks, {
        includeMetadata: true,
        maxContextLength,
        instructionTemplate
      });

      console.log(`Prompt built (${prompt.length} characters)`);
      // console.log(`Prompt Preview: ${prompt}...`);

      // Generate response with Gemini
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxOutputTokens,
          topK: 40,
          topP: 0.95,
        }
      });

      const response = result.response;
      const answer = response.text();

      console.log(`AI response generated (${answer.length} characters)`);

      return {
        answer: answer,
        sourcesUsed: validChunks.length,
        model: "gemini-2.5-flash"
      };

    } catch (error) {
      console.error("LLM generation error:", error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
