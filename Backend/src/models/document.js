// src/models/Document.js
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    original_filename: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50 * 1024 * 1024 // 50MB max
      }
    },
    total_pages: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    chunk_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    processing_status: {
      type: DataTypes.ENUM(
        'uploading',
        'processing', 
        'completed',
        'failed'
      ),
      defaultValue: 'uploading',
      allowNull: false
    },
    chroma_collection_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processing_error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['processing_status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Document.prototype.markAsProcessing = async function() {
    this.processing_status = 'processing';
    this.processing_error = null;
    await this.save();
  };

  Document.prototype.markAsCompleted = async function(totalPages, chunkCount, chromaCollectionId) {
    this.processing_status = 'completed';
    this.total_pages = totalPages;
    this.chunk_count = chunkCount;
    this.chroma_collection_id = chromaCollectionId;
    this.processed_at = new Date();
    this.processing_error = null;
    await this.save();
  };

  Document.prototype.markAsFailed = async function(error) {
    this.processing_status = 'failed';
    this.processing_error = error;
    await this.save();
  };

  // Class methods
  Document.findByUser = async function(userId, options = {}) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Document.findCompletedByUser = async function(userId) {
    return await this.findAll({
      where: { 
        user_id: userId,
        processing_status: 'completed'
      },
      order: [['created_at', 'DESC']]
    });
  };

  return Document;
};
