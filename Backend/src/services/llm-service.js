const axios = require("axios");

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || "openai";
    this.apiKey = process.env.LLM_API_KEY;
    this.model = process.env.LLM_MODEL || "gpt-3.5-turbo";
    this.baseURL = this.getBaseURL();
  }

  /**
   * Get base URL based on provider
   */
  getBaseURL() {
    const urls = {
      openai: "https://api.openai.com/v1",
      ollama: process.env.OLLAMA_URL || "http://localhost:11434",
      anthropic: "https://api.anthropic.com/v1",
    };
    return urls[this.provider] || urls.openai;
  }

  /**
   * Generate answer using LLM based on complete prompt
   * @param {string} prompt - Complete prompt (already built with context and query)
   * @param {Object} options - Additional generation options
   * @returns {Object} LLM response
   */
  async generateAnswer(prompt, options = {}) {
    try {
      const response = await this.callLLM(prompt, options);
      return {
        answer: response.content,
        model: this.model,
        provider: this.provider,
        tokensUsed: response.tokensUsed,
      };
    } catch (error) {
      console.error("Error generating answer:", error);
      throw new Error("Failed to generate answer from LLM");
    }
  }

  /**
   * Call LLM API based on provider
   * @param {string} prompt - Complete prompt to send
   * @param {Object} options - Generation options
   * @returns {Object} Parsed response
   */
  async callLLM(prompt, options) {
    switch (this.provider) {
      case "openai":
        return await this.callOpenAI(prompt, options);
      case "ollama":
        return await this.callOllama(prompt, options);
      case "anthropic":
        return await this.callAnthropic(prompt, options);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, options) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
    };
  }

  /**
   * Call Ollama API (local LLM)
   */
  async callOllama(prompt, options) {
    const response = await axios.post(`${this.baseURL}/api/generate`, {
      model: this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 1000,
      },
    });

    return {
      content: response.data.response,
      tokensUsed: response.data.eval_count || 0,
    };
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(prompt, options) {
    const response = await axios.post(
      `${this.baseURL}/messages`,
      {
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: response.data.content[0].text,
      tokensUsed:
        response.data.usage.input_tokens + response.data.usage.output_tokens,
    };
  }

  /**
   * Stream answer generation (for real-time responses)
   * @param {string} prompt - Complete prompt
   * @param {Object} options - Generation options
   * @param {Function} onChunk - Callback for each chunk
   */
  async streamAnswer(prompt, options = {}, onChunk) {
    if (this.provider !== "openai" && this.provider !== "ollama") {
      throw new Error("Streaming not supported for this provider");
    }

    try {
      if (this.provider === "openai") {
        return await this.streamOpenAI(prompt, options, onChunk);
      } else if (this.provider === "ollama") {
        return await this.streamOllama(prompt, options, onChunk);
      }
    } catch (error) {
      console.error("Error streaming answer:", error);
      throw new Error("Failed to stream answer");
    }
  }

  /**
   * Stream from OpenAI
   */
  async streamOpenAI(prompt, options, onChunk) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    return new Promise((resolve, reject) => {
      let fullContent = "";

      response.data.on("data", (chunk) => {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.includes("[DONE]")) {
            resolve({ content: fullContent });
            return;
          }
          try {
            const json = JSON.parse(line.replace("data: ", ""));
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });

      response.data.on("error", reject);
    });
  }

  /**
   * Stream from Ollama
   */
  async streamOllama(prompt, options, onChunk) {
    const response = await axios.post(
      `${this.baseURL}/api/generate`,
      {
        model: this.model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 1000,
        },
      },
      {
        responseType: "stream",
      }
    );

    return new Promise((resolve, reject) => {
      let fullContent = "";

      response.data.on("data", (chunk) => {
        try {
          const json = JSON.parse(chunk.toString());
          if (json.response) {
            fullContent += json.response;
            onChunk(json.response);
          }
          if (json.done) {
            resolve({ content: fullContent });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      response.data.on("error", reject);
    });
  }
}

module.exports = new LLMService();
