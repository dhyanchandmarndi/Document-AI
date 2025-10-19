// src/middleware/validateQuery.js
const validateQuery = (req, res, next) => {
  try {
    const { query, documentIds } = req.body;

    // Validate query text
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query text is required and cannot be empty'
      });
    }

    if (query.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Query too long. Maximum 1000 characters allowed'
      });
    }

    // Validate documentIds
    if (documentIds !== undefined && !Array.isArray(documentIds)) {
      return res.status(400).json({
        success: false,
        message: 'documentIds must be an array'
      });
    }

    // Sanitize query text
    req.body.query = query.trim();

    next();
  } catch (error) {
    console.error('Query validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Query validation failed'
    });
  }
};

module.exports = { validateQuery };
