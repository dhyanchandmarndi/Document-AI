// components/MainContent.jsx
import React from "react";
import SmartTextBox from "./SmartTextBox";

const MainContent = ({ messages, onSend, sidebarCollapsed, isMobile, onToggleSidebar }) => {
  return (
    <div className="flex flex-col h-full bg-[#222222]">
      {/* Mobile header with hamburger when sidebar is collapsed */}
      {isMobile && (
        <div className="flex-shrink-0 p-4 border-b border-gray-700/50 bg-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                DocumentAI
              </span>
            </div>
            {/* Hamburger menu button for mobile */}
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
            {/* Header */}
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

            {/* Input Box */}
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
            <div className={`mx-auto space-y-3 sm:space-y-4 ${
              isMobile 
                ? 'max-w-full' 
                : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
            }`}>
              {messages.map((message) => (
                <div key={message.id} className={`bg-[#2a2a2a]/40 backdrop-blur-sm rounded-xl border border-gray-700/30 ${
                  isMobile ? 'p-4' : 'p-4 sm:p-5'
                }`}>
                  <div className={`flex items-start ${
                    isMobile ? 'gap-3' : 'gap-3 sm:gap-4'
                  }`}>
                    <div className={`bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium ${
                      isMobile ? 'w-8 h-8 text-sm' : 'w-7 h-7 sm:w-8 sm:h-8 text-sm'
                    }`}>
                      U
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-2 ${
                        isMobile ? 'mb-2' : 'mb-2 sm:mb-3'
                      }`}>
                        <span className={`font-medium text-white ${
                          isMobile ? 'text-sm' : 'text-sm sm:text-base'
                        }`}>You</span>
                      </div>
                      <div className={`text-gray-200 leading-relaxed ${
                        isMobile ? 'text-sm' : 'text-sm sm:text-base'
                      }`}>
                        {message.text}
                      </div>
                      {message.files.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${
                          isMobile ? 'mt-2' : 'mt-3'
                        }`}>
                          {message.files.map((file, index) => (
                            <div key={index} className={`flex items-center bg-gray-700/40 rounded-lg px-3 py-1.5 ${
                              isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                            }`}>
                              <svg className={`text-cyan-400/80 mr-2 ${
                                isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="text-gray-300 truncate max-w-32 sm:max-w-48">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
