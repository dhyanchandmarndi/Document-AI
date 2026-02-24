const { exec, spawn } = require("child_process");
const https = require("https");
const logger = require("../config/logger");

class ModelManager {
  // List installed Ollama models
  listModels() {
    return new Promise((resolve, reject) => {
      exec("ollama list", (error, stdout) => {
        if (error) {
          logger.error("Failed to list Ollama models", {
            error: error.message,
          });
          return reject(error);
        }

        const lines = stdout.split("\n").slice(1).filter(Boolean);

        const models = lines.map((line) => {
          const parts = line.trim().split(/\s+/);
          return {
            name: parts[0],
            id: parts[1],
            size: parseSizeToBytes(parts[2] + (parts[3] ? ` ${parts[3]}` : "")),
            modified_at: new Date().toISOString(),
            details: {
              parameter_size: null,
            },
          };
        });

        logger.debug("Listed installed Ollama models", {
          count: models.length,
        });
        resolve({ models });
      });
    });
  }

  // Search models by scraping ollama.com/library
  searchModels(query) {
    return new Promise((resolve, reject) => {
      const url = `https://ollama.com/search?q=${encodeURIComponent(query)}`;

      logger.debug("Searching Ollama model library", { query });

      https
        .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
          let html = "";
          res.on("data", (chunk) => (html += chunk));
          res.on("end", () => {
            try {
              const models = parseOllamaSearchResults(html);
              logger.debug("Ollama model search complete", {
                query,
                resultsFound: models.length,
              });
              resolve({ models });
            } catch (err) {
              logger.error("Failed to parse Ollama search results", {
                query,
                error: err.message,
              });
              reject(err);
            }
          });
        })
        .on("error", (err) => {
          logger.error("Ollama search request failed", {
            query,
            url,
            error: err.message,
          });
          reject(err);
        });
    });
  }

  // Stream pull progress via spawn instead of exec
  pullModelStream(modelName, onData, onError, onComplete) {
    logger.info("Starting Ollama model pull", { modelName });

    const startTime = Date.now();
    const process = spawn("ollama", ["pull", modelName]);

    process.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => onData(line));
    });

    process.stderr.on("data", (data) => {
      // Ollama writes pull progress to stderr — treat as data, not errors
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => onData(line));
    });

    process.on("error", (err) => {
      logger.error("Ollama pull process error", {
        modelName,
        error: err.message,
      });
      onError(err.message);
    });

    process.on("close", (code) => {
      const latencyMs = Date.now() - startTime;

      if (code === 0) {
        logger.info("Ollama model pull complete", { modelName, latencyMs });
        onComplete();
      } else {
        logger.error("Ollama model pull failed", {
          modelName,
          exitCode: code,
          latencyMs,
        });
        onError(`Process exited with code ${code}`);
      }
    });

    return process;
  }

  // Delete model
  deleteModel(modelName) {
    return new Promise((resolve, reject) => {
      logger.info("Deleting Ollama model", { modelName });

      exec(`ollama rm ${modelName}`, (error, stdout) => {
        if (error) {
          logger.error("Failed to delete Ollama model", {
            modelName,
            error: error.message,
          });
          return reject(error);
        }

        logger.info("Ollama model deleted", { modelName });
        resolve(stdout);
      });
    });
  }
}

function parseSizeToBytes(sizeStr) {
  const [value, unit] = sizeStr.split(" ");
  const num = parseFloat(value);
  if (unit === "GB") return num * 1e9;
  if (unit === "MB") return num * 1e6;
  return num;
}

function parseOllamaSearchResults(html) {
  const models = [];
  const modelPattern = /href="\/library\/([^"]+)"[^>]*>/g;
  const names = new Set();
  let match;

  while ((match = modelPattern.exec(html)) !== null) {
    const name = match[1];
    if (!name.includes("/") && !name.includes("?") && name.length > 0) {
      names.add(name);
    }
  }

  names.forEach((name) => {
    const blockStart = html.indexOf(`/library/${name}"`);
    if (blockStart === -1) return;

    const block = html.substring(blockStart, blockStart + 1500);

    const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    const pullsMatch = block.match(/([\d.]+[KMB]?)\s*pulls/i);
    const pullsRaw = pullsMatch ? pullsMatch[1] : null;
    const pulls = pullsRaw ? parseShortNumber(pullsRaw) : null;

    const tagsMatch = block.match(/([\d]+)\s*tags?/i);
    const tags = tagsMatch ? parseInt(tagsMatch[1]) : null;

    const updatedMatch = block.match(
      /(\d+\s+(?:hour|day|week|month|year)s?\s+ago)/i,
    );
    const updated = updatedMatch ? updatedMatch[1] : null;

    models.push({ name, description, pulls, tags, updated });
  });

  return models;
}

function parseShortNumber(str) {
  const num = parseFloat(str);
  if (str.endsWith("B")) return Math.round(num * 1e9);
  if (str.endsWith("M")) return Math.round(num * 1e6);
  if (str.endsWith("K")) return Math.round(num * 1e3);
  return Math.round(num);
}

module.exports = new ModelManager();
