// src/hooks/useConversations.js
import { useState, useEffect } from 'react';

const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const result = await response.json();
      setConversations(result.data.conversations || []);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (title = null) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(title ? { title } : {})
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const result = await response.json();
      
      // Add new conversation to list
      setConversations(prev => [result.data, ...prev]);
      
      return result.data;
    } catch (error) {
      console.error('Create conversation error:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:5000/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Delete conversation error:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
    setError
  };
};

export default useConversations;
