const axios = require("axios");

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

async function generateLocalResponse(prompt) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: "gemma2:2b",
      prompt: prompt,
      stream: false,
    });

    return response.data.response;
  } catch (error) {
    console.error("Ollama error:", error.message);
    throw new Error("Local LLM failed");
  }
}

module.exports = { generateLocalResponse };
