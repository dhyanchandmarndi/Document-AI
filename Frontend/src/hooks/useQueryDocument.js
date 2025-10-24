// hooks/useQueryDocument.js
import { useState } from 'react';

const useQueryDocument = () => {
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);

  const sendQuery = async (queryText, documentIds = [], useAI = true) => {
    setQuerying(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:5000/api/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: queryText,
          documentIds: documentIds,
          useAI: useAI
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Query failed');
      }

      const result = await response.json();
      
      return {
        success: true,
        answer: result.answer,
        retrieval: result.retrieval,
        ai: result.ai,
        query: result.query
      };

    } catch (error) {
      console.error('Query error:', error);
      setError(error.message);
      throw error;
    } finally {
      setQuerying(false);
    }
  };

  return {
    sendQuery,
    querying,
    error,
    setError
  };
};

export default useQueryDocument;
