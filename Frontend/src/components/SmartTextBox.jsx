// components/SmartTextBox.jsx - Updated with query integration
import React, { useState, useRef, useEffect } from "react";
import useDocumentUpload from "../hooks/useDocumentUpload";
import useQueryDocument from "../hooks/useQueryDocument";

const SmartTextBox = ({ onSend, placeholder = "Ask anything about your documents...", isMobile = false }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Add hooks
  const { uploadDocument, uploading, error: uploadError, setError: setUploadError } = useDocumentUpload();
  const { sendQuery, querying, error: queryError, setError: setQueryError } = useQueryDocument();

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

  const handleSend = async () => {
    if (text.trim() && !uploading && !querying) {
      const userMessage = {
        text: text.trim(),
        files: files.map(f => ({
          name: f.name,
          documentId: f.documentId,
          pages: f.pages,
          chunks: f.chunks
        }))
      };

      // Extract document IDs from uploaded files
      const documentIds = files
        .filter(f => f.uploaded && f.documentId)
        .map(f => f.documentId);

      // Call parent onSend to display user message
      if (onSend) {
        onSend(userMessage, async (conversationId) => {
          // This callback will be called after user message is displayed
          // Send query to backend if there's text
          if (text.trim()) {
            try {
              const result = await sendQuery(text.trim(), documentIds, true, conversationId);
              return result; // Return AI response to parent
            } catch (error) {
              console.error('Query failed:', error);
              return { error: true, message: error.message };
            }
          }
        });
      }

      // Clear input
      setText("");
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = isMobile ? "48px" : "44px";
      }
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploadError(null);
    
    for (const file of selectedFiles) {
      if (file.type === 'application/pdf') {
        try {
          const result = await uploadDocument(file);
          
          const uploadedFile = {
            name: result.document.original_filename,
            size: file.size,
            type: file.type,
            pages: result.document.total_pages,
            chunks: result.document.chunk_count,
            documentId: result.document.id,
            uploaded: true,
            backendData: result.document
          };
          
          setFiles(prev => [...prev, uploadedFile]);
          
        } catch (error) {
          console.error('Upload failed:', error);
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
        setFiles(prev => [...prev, file]);
      }
    }
    
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    if (!uploading && !querying) {
      fileInputRef.current?.click();
    }
  };

  const isProcessing = uploading || querying;

  return (
    <div className="w-full">
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
      `}</style>

      {/* Error displays */}
      {(uploadError || queryError) && (
        <div className={`bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 ${
          isMobile ? 'mb-3 p-3 text-xs' : 'mb-3 p-3 text-sm'
        }`}>
          {uploadError || queryError}
        </div>
      )}

      {/* File preview area */}
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
                  file.error 
                    ? 'text-red-300' 
                    : file.uploaded 
                      ? 'text-green-300' 
                      : 'text-gray-300'
                }`}>
                  {file.name}
                </span>
                {file.uploaded && file.pages && (
                  <span className="text-green-500/70 text-xs mr-2">
                    ({file.pages}p, {file.chunks}c)
                  </span>
                )}
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

      {/* Main input container */}
      <div className={`relative bg-[#2a2a2a]/40 backdrop-blur-sm border rounded-xl transition-all duration-300 ${
        isFocused 
          ? 'border-gray-500/60 shadow-sm shadow-gray-500/10' 
          : 'border-gray-700/50 hover:border-gray-600/60'
      } ${isMobile ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl'} ${
        isProcessing ? 'opacity-75' : ''
      }`}>
        <div className="flex flex-col">
          {/* Text area */}
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
              placeholder={
                uploading ? "Processing PDF document..." : 
                querying ? "Querying documents..." :
                placeholder
              }
              rows={1}
              disabled={querying}
              className={`custom-scrollbar w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none leading-6 ${
                isMobile ? 'text-base' : 'text-base sm:text-lg'
              } ${querying ? 'cursor-not-allowed' : ''}`}
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
              {/* Attach button */}
              <button 
                onClick={triggerFileInput}
                disabled={isProcessing}
                className={`text-gray-500 hover:text-gray-300 hover:bg-gray-700/30 rounded-lg transition-all duration-200 ${
                  isMobile ? 'p-3' : 'p-2.5'
                } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                title={uploading ? "Processing..." : querying ? "Querying..." : "Attach files"}
              >
                {uploading ? (
                  <div className={`border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ${
                    isMobile ? 'w-6 h-6' : 'w-5 h-5'
                  }`}></div>
                ) : querying ? (
                  <div className={`border-2 border-purple-500 border-t-transparent rounded-full animate-spin ${
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

              {/* File count indicator */}
              {files.length > 0 && (
                <span className={`text-cyan-400/80 bg-cyan-400/10 rounded-full ${
                  isMobile ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
                }`}>
                  {files.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <button 
              onClick={handleSend}
              disabled={!text.trim() || uploading || querying}
              className={`rounded-lg transition-all duration-200 ${
                ((!text.trim() && files.length === 0) || isProcessing)
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

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf"
          disabled={isProcessing}
        />
      </div>

      {/* Helper text */}
      <div className={`text-center ${
        isMobile ? 'mt-2 text-xs' : 'mt-2 text-xs sm:text-sm'
      }`}>
        {uploading ? (
          <span className="text-yellow-400 flex items-center justify-center">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing PDF document...
          </span>
        ) : querying ? (
          <span className="text-purple-400 flex items-center justify-center">
            <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Querying documents with AI...
          </span>
        ) : (
          <span className="text-gray-600">
            Press <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">↵</kbd> to send • <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">⇧↵</kbd> for new line
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
