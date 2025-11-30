// components/MainContent.jsx
import React from "react";
import SmartTextBox from "./SmartTextBox";
import ReactMarkdown from 'react-markdown';

const MainContent = ({ messages, onSend, sidebarCollapsed, isMobile, onToggleSidebar, messagesEndRef }) => {
  return (
    <div className="flex flex-col h-full bg-[#222222]">
      {/* Mobile header */}
      {isMobile && (
        <div className="flex-shrink-0 p-4 border-b border-gray-700/50 bg-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                DocumentAI
              </span>
            </div>
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-800/60 transition-colors"
              title="Open menu"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        // Welcome screen
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
          <div className={`w-full ${
            isMobile ? 'max-w-sm' : 'max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl'
          }`}>
            <div className={`text-center ${
              isMobile ? 'mb-8' : 'mb-8 sm:mb-10 lg:mb-12'
            }`}>
              <h1 className={`font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent ${
                isMobile 
                  ? 'text-3xl sm:text-4xl mb-3' 
                  : 'text-4xl sm:text-5xl lg:text-6xl mb-4'
              }`}>
                Document<span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className={`text-gray-400 mx-auto leading-relaxed ${
                isMobile 
                  ? 'text-base max-w-xs' 
                  : 'text-lg sm:text-xl max-w-md sm:max-w-lg lg:max-w-xl'
              }`}>
                Your GenAI-powered Document Intelligence Platform
              </p>
            </div>

            <div className={isMobile ? 'mb-6' : 'mb-8'}>
              <SmartTextBox onSend={onSend} isMobile={isMobile} />
            </div>
          </div>
        </div>
      ) : (
        // Chat view
        <div className="flex flex-col h-full">
          {/* Chat messages */}
          <div className={`flex-1 overflow-y-auto ${
            isMobile ? 'p-3' : 'p-4 sm:p-5 lg:p-6'
          }`} style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 transparent'
          }}>
            <div className={`mx-auto space-y-4 ${
              isMobile 
                ? 'max-w-full' 
                : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
            }`}>
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`bg-[#2a2a2a]/40 backdrop-blur-sm rounded-xl border border-gray-700/30 ${
                    isMobile ? 'p-4' : 'p-5 sm:p-6'
                  }`}
                >
                  {/* Query Section */}
                  <div className="mb-4">
                    <div className={`text-gray-200 leading-relaxed ${
                      isMobile ? 'text-sm' : 'text-base sm:text-lg'
                    }`}>
                      {message.text}
                    </div>
                    
                    {/* Attached files */}
                    {message.files && message.files.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${
                        isMobile ? 'mt-3' : 'mt-4'
                      }`}>
                        {message.files.map((file, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center bg-gray-700/30 rounded-lg px-3 py-1.5 ${
                              isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                            }`}
                          >
                            <svg className={`text-cyan-400/80 mr-2 ${
                              isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-gray-300 truncate max-w-32 sm:max-w-48">
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-700/30 my-4"></div>

                  {/* Response Section */}
                  <div>
                    {/* Loading State */}
                    {message.isLoading && (
                      <div className="flex flex-col items-start space-y-3">
                        <div className="flex items-center space-x-2 text-cyan-400">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          <span className={`text-cyan-400/90 ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            Reading documents and generating response...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AI Response */}
                    {message.aiResponse && !message.isLoading && (
                      <div>
                        <div className={`text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none ${
                          isMobile ? 'text-sm' : 'text-sm sm:text-base'
                        }`}>
                          <ReactMarkdown
                            components={{
                              // Style bullet lists
                              ul: ({node, ...props}) => (
                                <ul className="list-disc list-inside space-y-1 my-2" {...props} />
                              ),
                              // Style ordered lists
                              ol: ({node, ...props}) => (
                                <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
                              ),
                              // Style list items
                              li: ({node, ...props}) => (
                                <li className="ml-4" {...props} />
                              ),
                              // Style bold text
                              strong: ({node, ...props}) => (
                                <strong className="font-semibold text-white" {...props} />
                              ),
                              // Style paragraphs
                              p: ({node, ...props}) => (
                                <p className="mb-2" {...props} />
                              ),
                              // Style headings
                              h1: ({node, ...props}) => (
                                <h1 className="text-lg font-bold mb-2 mt-3" {...props} />
                              ),
                              h2: ({node, ...props}) => (
                                <h2 className="text-base font-bold mb-2 mt-3" {...props} />
                              ),
                              h3: ({node, ...props}) => (
                                <h3 className="text-sm font-bold mb-2 mt-2" {...props} />
                              ),
                              // Style code blocks
                              code: ({node, inline, ...props}) => 
                                inline ? (
                                  <code className="bg-gray-800 px-1.5 py-0.5 rounded text-cyan-400 text-xs" {...props} />
                                ) : (
                                  <code className="block bg-gray-800 p-3 rounded-lg my-2 text-sm overflow-x-auto" {...props} />
                                )
                            }}
                          >
                            {message.aiResponse.answer || 'No response generated'}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Metadata footer */}
                        {message.aiResponse.retrieval && (
                          <div className={`mt-4 pt-4 border-t border-gray-700/30 flex items-center justify-between ${
                            isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                          }`}>
                            <div className="flex items-center space-x-4 text-gray-500">
                              {/* <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {message.aiResponse.retrieval.chunks?.length || 0} chunks
                              </span> */}
                              {message.aiResponse.ai?.model && (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  {message.aiResponse.ai.model}
                                </span>
                              )}
                            </div>
                            {message.aiResponse.retrieval.processingTime && (
                              <span className="text-gray-500">
                                {message.aiResponse.retrieval.processingTime.toFixed(2)}s
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error State */}
                    {message.error && !message.isLoading && (
                      <div className={`flex items-start space-x-2 text-red-400 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{message.errorMessage || 'Failed to process query'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom input */}
          <div className={`border-t border-gray-700/50 bg-[#222222]/95 backdrop-blur-sm ${
            isMobile ? 'p-3' : 'p-4 sm:p-5'
          }`}>
            <div className={`mx-auto ${
              isMobile 
                ? 'max-w-full' 
                : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
            }`}>
              <SmartTextBox 
                onSend={onSend} 
                placeholder="Ask a follow-up question..." 
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
