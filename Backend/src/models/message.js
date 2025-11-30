// src/models/Message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    query_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ai_response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    document_ids: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    chunks_used: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    processing_time: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    model_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    error: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['conversation_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['error']
      }
    ]
  });

  // Associations
  Message.associate = function(models) {
    Message.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation'
    });
    
    Message.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Instance methods
  Message.prototype.markAsError = async function(errorMessage) {
    this.error = true;
    this.error_message = errorMessage;
    await this.save();
  };

  Message.prototype.setAIResponse = async function(response, metadata = {}) {
    this.ai_response = response;
    this.chunks_used = metadata.chunksUsed || 0;
    this.processing_time = metadata.processingTime || null;
    this.model_name = metadata.modelName || null;
    this.error = false;
    this.error_message = null;
    await this.save();
  };

  // Class methods
  Message.findByConversation = async function(conversationId, options = {}) {
    return await this.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']],
      ...options
    });
  };

  Message.findByUser = async function(userId, options = {}) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  return Message;
};
