// components/SmartTextBox.jsx - Updated with query integration
import React, { useState, useRef, useEffect } from "react";
import useDocumentUpload from "../hooks/useDocumentUpload";
import useQueryDocument from "../hooks/useQueryDocument";

const SmartTextBox = ({
  onSend,
  placeholder = "Ask anything about your documents...",
  isMobile = false,
}) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);

  // For selecting models
  const selectOption = (value) => {
    setProvider(value);
    setOpen(false);
  };

  // Add hooks
  const {
    uploadDocument,
    uploading,
    error: uploadError,
    setError: setUploadError,
  } = useDocumentUpload();
  const {
    sendQuery,
    querying,
    error: queryError,
    setError: setQueryError,
    selectedModel,
    setSelectedModel,
    availableModels,
    modelsLoading,
  } = useQueryDocument();

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const minHeight = isMobile ? 48 : 44;
      const maxHeight = isMobile ? 140 : 120;
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight,
      );
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
        files: files.map((f) => ({
          name: f.name,
          documentId: f.documentId,
          pages: f.pages,
          chunks: f.chunks,
        })),
      };

      // Extract document IDs from uploaded files
      const documentIds = files
        .filter((f) => f.uploaded && f.documentId)
        .map((f) => f.documentId);

      // Call parent onSend to display user message
      if (onSend) {
        onSend(userMessage, async (conversationId) => {
          // This callback will be called after user message is displayed
          // Send query to backend if there's text
          if (text.trim()) {
            try {
              const result = await sendQuery(
                text.trim(),
                documentIds,
                true,
                conversationId,
              );
              return result; // Return AI response to parent
            } catch (error) {
              console.error("Query failed:", error);
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
      if (file.type === "application/pdf") {
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
            backendData: result.document,
          };

          setFiles((prev) => [...prev, uploadedFile]);
        } catch (error) {
          console.error("Upload failed:", error);
          const failedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded: false,
            error: true,
          };
          setFiles((prev) => [...prev, failedFile]);
        }
      } else {
        setFiles((prev) => [...prev, file]);
      }
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
        <div
          className={`bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 ${
            isMobile ? "mb-3 p-3 text-xs" : "mb-3 p-3 text-sm"
          }`}
        >
          {uploadError || queryError}
        </div>
      )}

      {/* File preview area */}
      {files.length > 0 && (
        <div
          className={`bg-[#0a0a0a]/60 backdrop-blur-sm rounded-xl border border-gray-700/50 ${
            isMobile ? "mb-3 p-3" : "mb-3 p-3 sm:p-4"
          }`}
        >
          <div
            className={`text-gray-500 mb-2 ${
              isMobile ? "text-xs" : "text-xs sm:text-sm"
            }`}
          >
            Attached files:
          </div>
          <div
            className={`flex flex-wrap ${
              isMobile ? "gap-2" : "gap-2 sm:gap-3"
            }`}
          >
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center rounded-lg hover:bg-[#3a3a3a]/60 transition-all duration-200 ${
                  isMobile
                    ? "px-3 py-1.5 text-xs"
                    : "px-3 py-1.5 text-xs sm:text-sm"
                } ${
                  file.error
                    ? "bg-red-500/10 border border-red-500/20"
                    : file.uploaded
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-[#333333]/60"
                }`}
              >
                <svg
                  className={`mr-2 ${isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} ${
                    file.error
                      ? "text-red-400/80"
                      : file.uploaded
                        ? "text-green-400/80"
                        : "text-cyan-400/80"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span
                  className={`mr-2 truncate ${
                    isMobile ? "max-w-24" : "max-w-32 sm:max-w-48"
                  } ${
                    file.error
                      ? "text-red-300"
                      : file.uploaded
                        ? "text-green-300"
                        : "text-gray-300"
                  }`}
                >
                  {file.name}
                </span>
                {file.uploaded && file.pages && (
                  <span className="text-green-500/70 text-xs mr-2">
                    ({file.pages}p, {file.chunks}c)
                  </span>
                )}
                {file.error && (
                  <span className="text-red-500/70 text-xs mr-2">(failed)</span>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className={`transition-colors text-sm leading-none ${
                    file.error
                      ? "text-red-500 hover:text-red-400"
                      : file.uploaded
                        ? "text-green-500 hover:text-green-400"
                        : "text-gray-500 hover:text-red-400"
                  }`}
                  title="Remove file"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main input container */}
      <div
        className={`relative bg-[#0a0a0a]/40 backdrop-blur-sm border rounded-xl transition-all duration-300 ${
          isFocused
            ? "border-gray-500/60 shadow-sm shadow-gray-500/10"
            : "border-gray-700/50 hover:border-gray-600/60"
        } ${isMobile ? "rounded-xl" : "rounded-xl sm:rounded-2xl"} ${
          isProcessing ? "opacity-75" : ""
        }`}
      >
        <div className="flex flex-col">
          {/* Text area */}
          <div
            className={`flex-1 ${
              isMobile ? "px-4 pt-3 pb-1" : "px-4 sm:px-5 pt-3 pb-1"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                uploading
                  ? "Processing PDF document..."
                  : querying
                    ? "Querying documents..."
                    : placeholder
              }
              rows={1}
              disabled={querying}
              className={`custom-scrollbar w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none leading-6 ${
                isMobile ? "text-base" : "text-base sm:text-lg"
              } ${querying ? "cursor-not-allowed" : ""}`}
              style={{
                height: isMobile ? "48px" : "44px",
                minHeight: isMobile ? "48px" : "44px",
                paddingTop: isMobile ? "12px" : "10px",
                paddingBottom: isMobile ? "12px" : "10px",
              }}
            />
          </div>

          {/* Bottom bar */}
          <div
            className={`flex items-center justify-between ${
              isMobile ? "px-4 pb-3" : "px-4 sm:px-5 pb-2"
            }`}
          >
            <div
              className={`flex items-center ${
                isMobile ? "space-x-3" : "space-x-2"
              }`}
            >
              {/* Attach button */}
              <button
                onClick={triggerFileInput}
                disabled={isProcessing}
                className={`text-gray-500 hover:text-gray-300 hover:bg-gray-700/30 rounded-lg transition-all duration-200 ${
                  isMobile ? "p-3" : "p-2.5"
                } ${isProcessing ? "cursor-not-allowed opacity-50" : ""}`}
                title={
                  uploading
                    ? "Processing..."
                    : querying
                      ? "Querying..."
                      : "Attach files"
                }
              >
                {uploading ? (
                  <div
                    className={`border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ${
                      isMobile ? "w-6 h-6" : "w-5 h-5"
                    }`}
                  ></div>
                ) : querying ? (
                  <div
                    className={`border-2 border-purple-500 border-t-transparent rounded-full animate-spin ${
                      isMobile ? "w-6 h-6" : "w-5 h-5"
                    }`}
                  ></div>
                ) : (
                  <svg
                    className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                )}
              </button>

              {/* File count indicator */}
              {files.length > 0 && (
                <span
                  className={`text-cyan-400/80 bg-cyan-400/10 rounded-full ${
                    isMobile ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5"
                  }`}
                >
                  {files.length}
                </span>
              )}
            </div>

            <div className="flex items-center">
              <div className="relative inline-block text-xs m-3">
                {/* Trigger button */}
                <button
                  onClick={() => setOpen(!open)}
                  disabled={modelsLoading}
                  className="inline-flex items-center justify-center bg-[#2a2a2a]/40 border border-gray-700 text-gray-200 rounded-full px-3 py-1 shadow-xs focus:outline-none disabled:opacity-50"
                  type="button"
                >
                  {modelsLoading ? (
                    <span className="text-gray-400">Loading models...</span>
                  ) : (
                    <>
                      {/* Colored dot indicating cloud vs local */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${
                          availableModels.find((m) => m.id === selectedModel)
                            ?.type === "cloud"
                            ? "bg-cyan-400"
                            : "bg-green-400"
                        }`}
                      />
                      {availableModels.find((m) => m.id === selectedModel)
                        ?.label ||
                        selectedModel ||
                        "Select model"}
                      <span
                        className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                          availableModels.find((m) => m.id === selectedModel)
                            ?.type === "cloud"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {availableModels.find((m) => m.id === selectedModel)
                          ?.type === "cloud"
                          ? "Cloud"
                          : "Local"}
                      </span>
                    </>
                  )}
                  <svg
                    className="w-3 h-3 ml-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeWidth="2" d="m19 9-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {open && !modelsLoading && (
                  <div className="absolute right-0 mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-lg w-56 overflow-hidden z-10">
                    {/* Cloud section */}
                    {availableModels.filter((m) => m.type === "cloud").length >
                      0 && (
                      <>
                        <div className="px-3 pt-2.5 pb-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          Cloud
                        </div>
                        <ul className="px-1 pb-1">
                          {availableModels
                            .filter((m) => m.type === "cloud")
                            .map((model) => (
                              <li key={model.id}>
                                <button
                                  onClick={() => {
                                    setSelectedModel(model.id);
                                    setOpen(false);
                                  }}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                                    selectedModel === model.id
                                      ? "bg-cyan-500/10 text-cyan-400"
                                      : "text-gray-200 hover:bg-gray-700"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                  {model.label}
                                  {selectedModel === model.id && (
                                    <svg
                                      className="w-3 h-3 ml-auto"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}

                    {/* Divider if both sections exist */}
                    {availableModels.some((m) => m.type === "cloud") &&
                      availableModels.some((m) => m.type === "local") && (
                        <div className="border-t border-gray-700/50 my-1" />
                      )}

                    {/* Local section */}
                    {availableModels.filter((m) => m.type === "local").length >
                    0 ? (
                      <>
                        <div className="px-3 pt-2 pb-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          Local
                        </div>
                        <ul className="px-1 pb-1">
                          {availableModels
                            .filter((m) => m.type === "local")
                            .map((model) => (
                              <li key={model.id}>
                                <button
                                  onClick={() => {
                                    setSelectedModel(model.id);
                                    setOpen(false);
                                  }}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                                    selectedModel === model.id
                                      ? "bg-green-500/10 text-green-400"
                                      : "text-gray-200 hover:bg-gray-700"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                  {model.label}
                                  {selectedModel === model.id && (
                                    <svg
                                      className="w-3 h-3 ml-auto"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </li>
                            ))}
                        </ul>
                      </>
                    ) : (
                      // No local models installed yet
                      <div className="px-3 py-3 text-center">
                        <p className="text-gray-500 text-[11px]">
                          No local models installed
                        </p>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          Use Model Manager to download one
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
      <div
        className={`text-center ${
          isMobile ? "mt-2 text-xs" : "mt-2 text-xs sm:text-sm"
        }`}
      >
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
            Press{" "}
            <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">
              ↵
            </kbd>{" "}
            to send •{" "}
            <kbd className="bg-gray-800/50 px-1.5 py-0.5 rounded text-xs border border-gray-700">
              ⇧↵
            </kbd>{" "}
            for new line
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
