// migrations/XXXXXX-create-documents-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      original_filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_pages: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      chunk_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      processing_status: {
        type: Sequelize.ENUM(
          'uploading',
          'processing', 
          'completed',
          'failed'
        ),
        defaultValue: 'uploading',
        allowNull: false
      },
      chroma_collection_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processing_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('documents', ['user_id']);
    await queryInterface.addIndex('documents', ['processing_status']);
    await queryInterface.addIndex('documents', ['created_at']);
    await queryInterface.addIndex('documents', ['chroma_collection_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents');
  }
};
