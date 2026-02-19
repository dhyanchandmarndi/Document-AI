const express = require("express");
const router = express.Router();
const modelManager = require("../services/modelManager");

// GET /api/models/installed
router.get("/installed", async (req, res) => {
  try {
    const result = await modelManager.listModels();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/models/search?q=llama
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
    const result = await modelManager.searchModels(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// // POST /api/models/pull
// router.post("/pull", async (req, res) => {
//   const { name } = req.body;
//   if (!name) return res.status(400).json({ error: "Model name required" });
//   try {
//     await modelManager.pullModel(name);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// POST /api/models/pull  →  replaced with SSE endpoint
// GET /api/models/pull/:name/stream
router.get("/pull/:name/stream", (req, res) => {
  const modelName = decodeURIComponent(req.params.name);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy
  res.flushHeaders();

  const sendEvent = (type, payload) => {
    res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
  };

  sendEvent("start", { model: modelName });

  const child = modelManager.pullModelStream(
    modelName,

    // onData — parse Ollama's progress lines
    (line) => {
      const parsed = parseOllamaProgressLine(line);
      if (parsed) sendEvent("progress", parsed);
    },

    // onError
    (errMsg) => {
      sendEvent("error", { message: errMsg });
      res.end();
    },

    // onComplete
    () => {
      sendEvent("done", { model: modelName });
      res.end();
    },
  );

  // If client disconnects, kill the child process
  req.on("close", () => {
    child.kill();
  });
});

// DELETE /api/models/:name
router.delete("/:name", async (req, res) => {
  const modelName = decodeURIComponent(req.params.name);
  try {
    await modelManager.deleteModel(modelName);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parseOllamaProgressLine(line) {
  // Status-only lines e.g. "pulling manifest", "verifying sha256", "success"
  const statusOnlyPattern =
    /^(pulling manifest|verifying sha256 digest|writing manifest|removing any unused layers|success)$/i;
  if (statusOnlyPattern.test(line.trim())) {
    return {
      status: line.trim(),
      percent: null,
      downloaded: null,
      total: null,
    };
  }

  // Progress lines e.g. "pulling a1b2c3d4e5f6... 23% ▕███ ▏ 1.1 GB/4.7 GB 2.1 MB/s 2m30s"
  const progressPattern =
    /pulling\s+(\S+)\s+(\d+)%.*?([\d.]+\s*\w+)\/([\d.]+\s*\w+)(?:\s+([\d.]+\s*\w+\/s))?(?:\s+(\S+))?/i;
  const match = line.match(progressPattern);

  if (match) {
    return {
      status: "pulling",
      layer: match[1],
      percent: parseInt(match[2]),
      downloaded: match[3].trim(),
      total: match[4].trim(),
      speed: match[5] ? match[5].trim() : null,
      eta: match[6] ? match[6].trim() : null,
    };
  }

  // Fallback — unknown line format, pass it through as raw status
  if (line.trim()) {
    return { status: line.trim(), percent: null };
  }

  return null;
}

module.exports = router;
