// components/MainContent.jsx
import React from "react";
import SmartTextBox from "./SmartTextBox";

const MainContent = ({ messages, onSend, sidebarCollapsed }) => {
  return (
    <div className="flex flex-col h-full bg-[#222222]">
      {messages.length === 0 ? (
        // Welcome screen
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-3xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Document<span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                Your GenAI-powered Document Intelligence Platform
              </p>
            </div>

            {/* Input Box */}
            <div className="mb-8">
              <SmartTextBox onSend={onSend} />
            </div>
          </div>
        </div>
      ) : (
        // Chat view
        <div className="flex flex-col h-full">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-6" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 transparent'
          }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-[#2a2a2a]/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      U
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-200 leading-relaxed">
                        {message.text}
                      </div>
                      {message.files.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.files.map((file, index) => (
                            <div key={index} className="flex items-center bg-gray-700/40 rounded-lg px-3 py-1.5 text-sm">
                              <svg className="w-3.5 h-3.5 text-cyan-400/80 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="text-gray-300 text-xs">{file.name}</span>
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
          <div className="border-t border-gray-700/50 bg-[#222222]/95 backdrop-blur-sm p-5">
            <div className="max-w-4xl mx-auto">
              <SmartTextBox onSend={onSend} placeholder="Ask a follow-up question..." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
