// src/models/index.js (add Document import and associations)
const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables from the root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Debug: Check if env vars are loaded
console.log('🔍 DB Config Check:');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_DIALECT:', process.env.DB_DIALECT || 'NOT SET');

// Fallback configuration
const dbConfig = {
  database: process.env.DB_NAME || 'document_ai',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres'
};

console.log('📋 Using DB Config:', {
  ...dbConfig,
  password: dbConfig.password ? '***HIDDEN***' : 'NOT SET'
});

// Initialize Sequelize with explicit config
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection function
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.error('❌ Connection details:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      dialect: dbConfig.dialect
    });
    return false;
  }
};

// Import models
const User = require('./user')(sequelize, Sequelize.DataTypes);
const Document = require('./document')(sequelize, Sequelize.DataTypes);
const Conversation = require('./conversation')(sequelize, Sequelize.DataTypes);
const Message = require('./message')(sequelize, Sequelize.DataTypes); 

// Define associations
User.hasMany(Document, { 
  foreignKey: 'user_id', 
  as: 'documents',
  onDelete: 'CASCADE'
});

User.hasMany(Conversation, {
  foreignKey: 'user_id',
  as: 'conversations',
  onDelete: 'CASCADE'
});

User.hasMany(Message, {
  foreignKey: 'user_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Document.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user'
});

Conversation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Conversation.hasMany(Message, {
  foreignKey: 'conversation_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

// Message associations
Message.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Message.belongsTo(Conversation, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

// Export everything
const db = {
  sequelize,
  Sequelize,
  User,
  Document, // ✅ Export Document model
  Conversation, // ✅ Add this
  Message 
};

module.exports = {
  db,
  testConnection
};
