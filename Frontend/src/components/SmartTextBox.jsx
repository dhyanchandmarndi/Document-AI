// components/SmartTextBox.jsx
import React, { useState, useRef, useEffect } from "react";

const SmartTextBox = ({ onSend, placeholder = "Ask anything about your documents..." }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120);
      textarea.style.height = newHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [text]);

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
    if (text.trim() || files.length > 0) {
      if (onSend) {
        onSend({ text: text.trim(), files });
      }
      setText("");
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar {
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: #4a5568 transparent;
        }
        
        /* Webkit browsers (Chrome, Safari, Edge) */
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
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #6a7485;
        }
        
        /* Hide scrollbar arrows */
        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }
        
        /* Corner where horizontal and vertical scrollbars meet */
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* File preview area */}
      {files.length > 0 && (
        <div className="mb-3 p-3 bg-[#2a2a2a]/60 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <div className="text-xs text-gray-500 mb-2">Attached files:</div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-[#333333]/60 rounded-lg px-3 py-1.5 text-xs hover:bg-[#3a3a3a]/60 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 text-cyan-400/80 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-gray-300 mr-2 max-w-32 truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm leading-none"
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
      }`}>
        <div className="flex flex-col">
          {/* Main text area with custom scrollbar */}
          <div className="flex-1 px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={1}
              className="custom-scrollbar w-full bg-transparent text-white text-base placeholder-gray-500 border-none outline-none resize-none leading-6"
              style={{ 
                height: "44px",
                minHeight: "44px",
                paddingTop: "10px",
                paddingBottom: "10px"
              }}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center space-x-2">
              {/* Attach button - increased size */}
              <button 
                onClick={triggerFileInput}
                className="p-2.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700/30 rounded-lg transition-all duration-200"
                title="Attach files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* File count indicator */}
              {files.length > 0 && (
                <span className="text-xs text-cyan-400/80 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <button 
              onClick={handleSend}
              disabled={!text.trim() && files.length === 0}
              className={`p-2 rounded-lg transition-all duration-200 ${
                (!text.trim() && files.length === 0)
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500/90 hover:bg-cyan-500 text-white shadow-sm hover:shadow-md'
              }`}
              title="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip"
        />
      </div>

      {/* Helper text */}
      <div className="mt-2 text-center text-xs text-gray-600">
        Press <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">↵</kbd> to send • <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">⇧↵</kbd> for new line
      </div>
    </div>
  );
};

export default SmartTextBox;
