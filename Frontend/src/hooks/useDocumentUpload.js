// hooks/useDocumentUpload.js
import { useState } from 'react';

const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadDocument = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      return {
        success: true,
        document: result.data,
        message: `Document processed: ${result.data.original_filename} (${result.data.total_pages} pages, ${result.data.chunk_count} chunks)`
      };

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadDocument,
    uploading,
    error,
    setError
  };
};

export default useDocumentUpload;
