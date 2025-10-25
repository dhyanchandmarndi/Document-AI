// src/routes/chatRoutes.js
const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// Conversation routes
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.put('/conversations/:id', chatController.updateConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

// Message routes
router.post('/conversations/:id/messages', chatController.createMessage);
router.get('/conversations/:id/messages', chatController.getMessages);
router.put('/messages/:messageId', chatController.updateMessage);

module.exports = router;
