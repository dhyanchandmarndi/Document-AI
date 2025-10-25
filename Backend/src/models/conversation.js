// src/models/Conversation.js
module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'New Conversation',
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['updated_at']
      }
    ]
  });

  // Associations
  Conversation.associate = function(models) {
    Conversation.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Conversation.hasMany(models.Message, {
      foreignKey: 'conversation_id',
      as: 'messages',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  Conversation.prototype.updateTitle = async function(title) {
    this.title = title;
    await this.save();
  };

  // Class methods
  Conversation.findByUser = async function(userId, options = {}) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['updated_at', 'DESC']],
      ...options
    });
  };

  Conversation.findWithMessages = async function(conversationId, userId) {
    const models = require('./index');
    return await this.findOne({
      where: { 
        id: conversationId,
        user_id: userId
      },
      include: [{
        model: models.Message,
        as: 'messages',
        order: [['created_at', 'ASC']]
      }]
    });
  };

  return Conversation;
};
