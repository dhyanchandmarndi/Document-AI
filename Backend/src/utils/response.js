// src/utils/response.js

// Success response helper
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Error response helper
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

// Validation error response helper
const validationErrorResponse = (res, errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
    timestamp: new Date().toISOString()
  });
};

// Pagination response helper
const paginationResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginationResponse
};
