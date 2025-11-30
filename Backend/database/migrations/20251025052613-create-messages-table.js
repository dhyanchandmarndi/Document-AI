// src/migrations/XXXXXX-create-messages-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      query_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ai_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      document_ids: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      chunks_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      processing_time: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      model_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      error: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('messages', ['conversation_id']);
    await queryInterface.addIndex('messages', ['user_id']);
    await queryInterface.addIndex('messages', ['created_at']);
    await queryInterface.addIndex('messages', ['error']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
