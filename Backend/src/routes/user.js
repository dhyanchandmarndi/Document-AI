// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/user');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin,
  validateProfileUpdate,
  validateChangePassword
} = require('../middleware/validation');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', validateRegistration, userController.register);
router.post('/login', validateLogin, userController.login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, userController.updateProfile);
router.post('/change-password', authenticateToken, validateChangePassword, userController.changePassword);

module.exports = router;
