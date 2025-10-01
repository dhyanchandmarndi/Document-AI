// src/controllers/userController.js
const userService = require('../services/user');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {

  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const { name, email, password } = req.body;
      const result = await userService.createUser({ name, email, password });

      return successResponse(res, result.data, result.message, 201);
    } catch (error) {
      console.error('Register error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const { email, password } = req.body;
      const result = await userService.authenticateUser(email, password);

      return successResponse(res, result.data, result.message, 200);
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, error.message, 401);
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const result = await userService.getUserById(userId);

      return successResponse(res, result.data, result.message, 200);
    } catch (error) {
      console.error('Get profile error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const userId = req.user.id;
      const result = await userService.updateUser(userId, req.body);

      return successResponse(res, result.data, result.message, 200);
    } catch (error) {
      console.error('Update profile error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      const result = await userService.changePassword(userId, currentPassword, newPassword);

      return successResponse(res, null, result.message, 200);
    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new UserController();
