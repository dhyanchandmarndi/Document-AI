const { exec } = require("child_process");

// Basic structure
class ModelManager {
  // List installed Ollama models
  listModels() {
    return new Promise((resolve, reject) => {
      exec("ollama list", (error, stdout) => {
        if (error) return reject(error);

        const lines = stdout.split("\n").slice(1).filter(Boolean);

        const models = lines.map((line) => {
          const parts = line.trim().split(/\s+/);
          return parts[0];
        });

        resolve(models);
      });
    });
  }

  // Downlaod models
  pullModel(modelName) {
    return new Promise((resolve, reject) => {
      exec(`ollama pull ${modelName}`, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout);
      });
    });
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

module.exports = new ModelManager();
