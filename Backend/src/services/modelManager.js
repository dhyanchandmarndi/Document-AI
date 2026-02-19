const { exec, spawn } = require("child_process");
const https = require("https");

class ModelManager {
  // List installed Ollama models
  listModels() {
    return new Promise((resolve, reject) => {
      exec("ollama list", (error, stdout) => {
        if (error) return reject(error);

        const lines = stdout
          .split("\n")
          .slice(1) // remove header
          .filter(Boolean);

        const models = lines.map((line) => {
          const parts = line.trim().split(/\s+/);

          return {
            name: parts[0],
            id: parts[1],
            size: parseSizeToBytes(parts[2] + (parts[3] ? ` ${parts[3]}` : "")),
            modified_at: new Date().toISOString(),
            details: {
              parameter_size: null, // not available from list output
            },
          };
        });

        resolve({ models });
      });
    });
  }

  // Search models by scraping ollama.com/library
  searchModels(query) {
    return new Promise((resolve, reject) => {
      const url = `https://ollama.com/search?q=${encodeURIComponent(query)}`;

      https
        .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
          let html = "";
          res.on("data", (chunk) => (html += chunk));
          res.on("end", () => {
            try {
              const models = parseOllamaSearchResults(html);
              resolve({ models });
            } catch (err) {
              reject(err);
            }
          });
        })
        .on("error", reject);
    });
  }

  // Download models
  // Stream pull progress via spawn instead of exec
  pullModelStream(modelName, onData, onError, onComplete) {
    const process = spawn("ollama", ["pull", modelName]);

    process.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => onData(line));
    });

    process.stderr.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      // Ollama actually writes progress to stderr, treat it as data not error
      lines.forEach((line) => onData(line));
    });

    process.on("error", (err) => {
      onError(err.message);
    });

    process.on("close", (code) => {
      if (code === 0) {
        onComplete();
      } else {
        onError(`Process exited with code ${code}`);
      }
    });

    // Return process so caller can kill it if needed
    return process;
  }

  // Delete models
  deleteModel(modelName) {
    return new Promise((resolve, reject) => {
      exec(`ollama rm ${modelName}`, (error, stdout) => {
        if (error) return reject(error);
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

  // Each model card contains the name in an anchor tag like:
  // <h2 ...><a href="/library/llama3">llama3</a></h2>
  // We extract name, description, pull count, and tag count

  // Match model blocks — each result is wrapped in a list item or article
  // This regex targets the model name from href="/library/<name>"
  const modelPattern = /href="\/library\/([^"]+)"[^>]*>/g;
  const names = new Set();
  let match;

  while ((match = modelPattern.exec(html)) !== null) {
    const name = match[1];
    // Filter out nav links and pagination — valid model names have no slashes
    if (!name.includes("/") && !name.includes("?") && name.length > 0) {
      names.add(name);
    }
  }

  // For each name, try to extract description and metadata from surrounding HTML
  names.forEach((name) => {
    // Find the block of HTML around this model's entry
    const blockStart = html.indexOf(`/library/${name}"`);
    if (blockStart === -1) return;

    // Grab a chunk of HTML around the link to extract metadata
    const block = html.substring(blockStart, blockStart + 1500);

    // Extract description — usually in a <p> tag after the title
    const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Extract pull count — looks like "1.2M pulls" or "45.3K pulls"
    const pullsMatch = block.match(/([\d.]+[KMB]?)\s*pulls/i);
    const pullsRaw = pullsMatch ? pullsMatch[1] : null;
    const pulls = pullsRaw ? parseShortNumber(pullsRaw) : null;

    // Extract tags count — looks like "72 tags"
    const tagsMatch = block.match(/([\d]+)\s*tags?/i);
    const tags = tagsMatch ? parseInt(tagsMatch[1]) : null;

    // Extract last updated — looks like "6 weeks ago" or "3 months ago"
    const updatedMatch = block.match(
      /(\d+\s+(?:hour|day|week|month|year)s?\s+ago)/i,
    );
    const updated = updatedMatch ? updatedMatch[1] : null;

    models.push({
      name,
      description,
      pulls,
      tags,
      updated,
    });
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
