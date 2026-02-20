const axios = require("axios");

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

// Accept modelName so any installed Ollama model can be used
async function generateLocalResponse(prompt, modelName = "gemma2:2b") {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: modelName,
      prompt: prompt,
      stream: false,
    });

    return response.data.response;
  } catch (error) {
    console.error("Ollama error:", error.message);
    throw new Error(
      `Local LLM failed for model "${modelName}": ${error.message}`,
    );
  }
}

module.exports = { generateLocalResponse };
