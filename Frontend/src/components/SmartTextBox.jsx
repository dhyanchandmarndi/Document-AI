// components/SmartTextBox.jsx - Updated with backend integration
import React, { useState, useRef, useEffect } from "react";
import useDocumentUpload from "../hooks/useDocumentUpload";

const SmartTextBox = ({ onSend, placeholder = "Ask anything about your documents...", isMobile = false }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Add document upload hook
  const { uploadDocument, uploading, error: uploadError, setError } = useDocumentUpload();

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const minHeight = isMobile ? 48 : 44;
      const maxHeight = isMobile ? 140 : 120;
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = newHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [text, isMobile]);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((text.trim() || files.length > 0) && !uploading) { // Prevent send while uploading
      if (onSend) {
        onSend({ text: text.trim(), files });
      }
      setText("");
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = isMobile ? "48px" : "44px";
      }
    }
  };

  // Modified file handling with backend upload
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setError(null); // Clear any previous errors
    
    for (const file of selectedFiles) {
      // Only process PDF files for backend upload
      if (file.type === 'application/pdf') {
        try {
          // Upload to backend
          const result = await uploadDocument(file);
          
          // Add uploaded file with backend data
          const uploadedFile = {
            name: result.document.original_filename,
            size: file.size,
            type: file.type,
            pages: result.document.total_pages,
            chunks: result.document.chunk_count,
            documentId: result.document.id,
            uploaded: true, // Mark as uploaded
            backendData: result.document // Store full backend response
          };
          
          setFiles(prev => [...prev, uploadedFile]);
          
        } catch (error) {
          console.error('Upload failed:', error);
          // Add failed file with error state
          const failedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded: false,
            error: true
          };
          setFiles(prev => [...prev, failedFile]);
        }
      } else {
        // For non-PDF files, add normally (no upload)
        setFiles(prev => [...prev, file]);
      }
    }
    
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    if (!uploading) { // Prevent file selection while uploading
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4a5568 transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5a6478;
        }
        
        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* Upload error display */}
      {uploadError && (
        <div className={`bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 ${
          isMobile ? 'mb-3 p-3 text-xs' : 'mb-3 p-3 text-sm'
        }`}>
          {uploadError}
        </div>
      )}

      {/* File preview area - Enhanced with upload status */}
      {files.length > 0 && (
        <div className={`bg-[#2a2a2a]/60 backdrop-blur-sm rounded-xl border border-gray-700/50 ${
          isMobile ? 'mb-3 p-3' : 'mb-3 p-3 sm:p-4'
        }`}>
          <div className={`text-gray-500 mb-2 ${
            isMobile ? 'text-xs' : 'text-xs sm:text-sm'
          }`}>Attached files:</div>
          <div className={`flex flex-wrap ${
            isMobile ? 'gap-2' : 'gap-2 sm:gap-3'
          }`}>
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center rounded-lg hover:bg-[#3a3a3a]/60 transition-all duration-200 ${
                  isMobile ? 'px-3 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
                } ${
                  // Different colors based on upload status
                  file.error 
                    ? 'bg-red-500/10 border border-red-500/20' 
                    : file.uploaded 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-[#333333]/60'
                }`}
              >
                <svg className={`mr-2 ${
                  isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                } ${
                  // Icon color based on status
                  file.error 
                    ? 'text-red-400/80' 
                    : file.uploaded 
                      ? 'text-green-400/80' 
                      : 'text-cyan-400/80'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className={`mr-2 truncate ${
                  isMobile ? 'max-w-24' : 'max-w-32 sm:max-w-48'
                } ${
                  // Text color based on status
                  file.error 
                    ? 'text-red-300' 
                    : file.uploaded 
                      ? 'text-green-300' 
                      : 'text-gray-300'
                }`}>
                  {file.name}
                </span>
                {/* Show upload info for PDFs */}
                {file.uploaded && file.pages && (
                  <span className="text-green-500/70 text-xs mr-2">
                    ({file.pages}p, {file.chunks}c)
                  </span>
                )}
                {/* Show error indicator */}
                {file.error && (
                  <span className="text-red-500/70 text-xs mr-2">
                    (failed)
                  </span>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className={`transition-colors text-sm leading-none ${
                    file.error 
                      ? 'text-red-500 hover:text-red-400' 
                      : file.uploaded 
                        ? 'text-green-500 hover:text-green-400' 
                        : 'text-gray-500 hover:text-red-400'
                  }`}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main input container - Same styling, enhanced functionality */}
      <div className={`relative bg-[#2a2a2a]/40 backdrop-blur-sm border rounded-xl transition-all duration-300 ${
        isFocused 
          ? 'border-gray-500/60 shadow-sm shadow-gray-500/10' 
          : 'border-gray-700/50 hover:border-gray-600/60'
      } ${isMobile ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl'} ${
        uploading ? 'opacity-75' : '' // Visual feedback while uploading
      }`}>
        <div className="flex flex-col">
          {/* Main text area */}
          <div className={`flex-1 ${
            isMobile ? 'px-4 pt-3 pb-1' : 'px-4 sm:px-5 pt-3 pb-1'
          }`}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploading ? "Processing PDF document..." : placeholder} // Dynamic placeholder
              rows={1}
              disabled={uploading} // Disable while uploading
              className={`custom-scrollbar w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none leading-6 ${
                isMobile ? 'text-base' : 'text-base sm:text-lg'
              } ${uploading ? 'cursor-not-allowed' : ''}`}
              style={{ 
                height: isMobile ? "48px" : "44px",
                minHeight: isMobile ? "48px" : "44px",
                paddingTop: isMobile ? "12px" : "10px",
                paddingBottom: isMobile ? "12px" : "10px"
              }}
            />
          </div>

          {/* Bottom bar */}
          <div className={`flex items-center justify-between ${
            isMobile ? 'px-4 pb-3' : 'px-4 sm:px-5 pb-2'
          }`}>
            <div className={`flex items-center ${
              isMobile ? 'space-x-3' : 'space-x-2'
            }`}>
              {/* Attach button - Enhanced with upload state */}
              <button 
                onClick={triggerFileInput}
                disabled={uploading} // Disable while uploading
                className={`text-gray-500 hover:text-gray-300 hover:bg-gray-700/30 rounded-lg transition-all duration-200 ${
                  isMobile ? 'p-3' : 'p-2.5'
                } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                title={uploading ? "Processing..." : "Attach files"}
              >
                {/* Show spinner while uploading */}
                {uploading ? (
                  <div className={`border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ${
                    isMobile ? 'w-6 h-6' : 'w-5 h-5'
                  }`}></div>
                ) : (
                  <svg className={`${
                    isMobile ? 'w-6 h-6' : 'w-5 h-5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>

              {/* File count indicator - Enhanced */}
              {files.length > 0 && (
                <span className={`text-cyan-400/80 bg-cyan-400/10 rounded-full ${
                  isMobile ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
                }`}>
                  {files.length}
                </span>
              )}
            </div>

            {/* Send button - Enhanced */}
            <button 
              onClick={handleSend}
              disabled={(!text.trim() && files.length === 0) || uploading} // Disable while uploading
              className={`rounded-lg transition-all duration-200 ${
                ((!text.trim() && files.length === 0) || uploading)
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500/90 hover:bg-cyan-500 text-white shadow-sm hover:shadow-md'
              } ${isMobile ? 'p-3' : 'p-2'}`}
              title="Send message"
            >
              <svg className={`${
                isMobile ? 'w-5 h-5' : 'w-4 h-4'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden file input - Modified to only accept PDFs for backend upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf" // Keep same file types
          disabled={uploading}
        />
      </div>

      {/* Helper text - Enhanced with upload status */}
      <div className={`text-center ${
        isMobile ? 'mt-2 text-xs' : 'mt-2 text-xs sm:text-sm'
      }`}>
        {uploading ? (
          <span className="text-yellow-400 flex items-center justify-center">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing PDF document...
          </span>
        ) : (
          <span className="text-gray-600">
            Press <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">↵</kbd> to send • <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">⇧↵</kbd> for new line
            {/* Add PDF upload hint */}
            <span className="block mt-1 text-gray-700">
              PDF files are automatically processed for AI chat
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default SmartTextBox;
