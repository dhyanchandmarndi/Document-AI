const express = require("express");
const router = express.Router();
const queryController = require("../controllers/query");

/**
 * POST /api/query
 * Query a specific document
 * Body: { documentId, question, options }
 */
router.post("/", async (req, res) => {
  await queryController.handleQuery(req, res);
});

/**
 * POST /api/query/multiple
 * Query across multiple documents
 * Body: { documentIds: [], question, options }
 */
router.post("/multiple", async (req, res) => {
  await queryController.handleMultiDocumentQuery(req, res);
});

/**
 * POST /api/query/conversational
 * Conversational query with history
 * Body: { documentId, question, chatHistory, options }
 */
router.post("/conversational", async (req, res) => {
  await queryController.handleConversationalQuery(req, res);
});

module.exports = router;
