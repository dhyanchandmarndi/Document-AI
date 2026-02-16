const express = require("express");
const router = express.Router();
const modelManager = require("../services/modelManager");

// List all models
router.get("/", async (req, res) => {
  const models = await modelManager.listModels();
  res.json(models);
});

// Download Models
router.post("/pull", async (req, res) => {
  const { model } = req.body;
  await modelManager.pullModel(model);
  res.json({ success: true });
});

// Delete Models

router.delete("/:model", async (req, res) => {
  await modelManager.deleteModel(req.params.model);
  res.json({ success: true });
});

module.exports = router;
