// src/services/userService.js
const { db } = require('../models');
const jwt = require('jsonwebtoken');

class UserService {
  
  // Create new user
  async createUser(userData) {
    try {
      userData.email = userData.email.toLowerCase();
      
      // Check if user exists
      const existingUser = await db.User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user (password will be hashed by model hook)
      const user = await db.User.create(userData);
      
      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Authenticate user
  async authenticateUser(email, password) {
    try {
      const user = await db.User.findByEmail(email.toLowerCase());
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        data: { user, token },
        message: 'Login successful'
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: user,
        message: 'User retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prevent updating sensitive fields
      delete updateData.id;
      delete updateData.email;
      delete updateData.password;
      delete updateData.created_at;
      delete updateData.updated_at;

      await user.update(updateData);

      return {
        success: true,
        data: user,
        message: 'User updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save(); // Will trigger beforeUpdate hook to hash password

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Verify token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new UserService();
