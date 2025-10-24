const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validateQuery');
const queryController = require('../controllers/query');

// POST /api/query - Process user query
router.post('/', 
  authenticateToken,
  validateQuery,
  queryController.processQuery
);

module.exports = router;