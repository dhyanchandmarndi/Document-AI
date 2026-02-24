const axios = require("axios");
const logger = require("../config/logger");

const OLLAMA_URL = process.env.OLLAMA_URL;

async function generateLocalResponse(prompt, modelName = "gemma2:2b") {
  const startTime = Date.now();

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: modelName,
      prompt: prompt,
      stream: false,
    });

    const latencyMs = Date.now() - startTime;

    logger.info("Ollama local response generated", {
      model: modelName, // fix: was referencing undefined `model`
      latencyMs,
    });

    return response.data.response;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logger.error("Ollama request failed", {
      model: modelName,
      ollamaUrl: OLLAMA_URL,
      error: error.message,
      latencyMs,
    });

    throw new Error(
      `Local LLM failed for model "${modelName}": ${error.message}`,
    );
  }
}

module.exports = { generateLocalResponse };
