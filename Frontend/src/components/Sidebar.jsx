// components/Sidebar.jsx
import React from "react";

const Sidebar = ({ collapsed, onToggle, onNewChat, isMobile }) => {
  // Sample chat history
  const chatHistory = [
    "Financial Report Analysis Q3 2024",
    "Marketing Campaign Performance Review",
    "Project Proposal Risk Assessment",
    "Customer Feedback Summary Document",
    "Quarterly Sales Data Analysis",
    "Product Development Strategy",
    "Budget Planning Document Review",
    "Competitive Analysis Report",
    "User Experience Research Findings",
    "Technical Documentation Review",
    "Market Research Survey Results",
    "Annual Performance Report"
  ];

  return (
    <>
      {/* Custom scrollbar styles for sidebar */}
      <style jsx>{`
        .sidebar-scroll {
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: #4a5568 transparent;
        }
        
        /* Webkit browsers (Chrome, Safari, Edge) */
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #5a6478;
        }
        
        /* Hide scrollbar buttons */
        .sidebar-scroll::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>

      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-[#222222] border-r border-gray-700 z-30 transition-all duration-300 ${
        isMobile 
          ? `w-80 ${collapsed ? '-translate-x-full' : 'translate-x-0'}` // Mobile: slide in/out
          : `${collapsed ? 'w-16' : 'w-64'}` // Desktop: same as original
      }`}>
        <div className="flex flex-col h-full">
          
          {/* Header Section - Fixed at top */}
          <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
            <div className={`flex items-center ${
              collapsed && !isMobile ? 'justify-center' : 'justify-between'
            }`}>
              {(!collapsed || isMobile) && (
                <div className="flex items-center">
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    DocumentAI
                  </span>
                </div>
              )}
              <button 
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-800/60 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobile ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : collapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* New Chat Button - Fixed - EXACT SAME AS ORIGINAL */}
          <div className="flex-shrink-0 p-4">
            <button 
              onClick={onNewChat}
              className={`w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 ${
                collapsed && !isMobile ? 'px-2' : 'px-3'
              }`}
              title="Start new chat"
            >
              {/* ORIGINAL ICON SIZE FROM YOUR REFERENCE */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {(!collapsed || isMobile) && <span className="ml-2">New Chat</span>}
            </button>
          </div>

          {/* Chat History - Scrollable Section - EXACT SAME AS ORIGINAL */}
          <div className="flex-1 flex flex-col min-h-0">
            {(!collapsed || isMobile) && (
              <div className="px-4 py-2 border-b border-gray-700/30">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Chat History
                </h3>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto sidebar-scroll">
              <div className="p-2 space-y-1">
                {chatHistory.map((chat, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-3 text-sm text-gray-400 hover:bg-gray-800/60 rounded-lg transition-all duration-200 hover:text-gray-200 group ${
                      collapsed && !isMobile ? 'px-2' : 'px-3'
                    }`}
                    title={collapsed && !isMobile ? chat : ""}
                  >
                    <div className={`flex items-center ${
                      collapsed && !isMobile ? 'justify-center' : ''
                    }`}>
                      {/* ORIGINAL ICON SIZE FROM YOUR REFERENCE */}
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.646-.388l-2.729 1.093a.5.5 0 01-.67-.65L8.051 17.95A8 8 0 1121 12z" />
                      </svg>
                      {(!collapsed || isMobile) && (
                        <span className="ml-3 truncate leading-5">
                          {chat}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Account Section - Fixed at bottom - EXACT SAME AS ORIGINAL */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700/50">
            <button className={`w-full flex items-center p-3 text-gray-400 hover:bg-gray-800/60 rounded-xl transition-all duration-200 hover:text-gray-200 ${
              collapsed && !isMobile ? 'justify-center' : ''
            }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">P</span>
              </div>
              {(!collapsed || isMobile) && (
                <>
                  <div className="ml-3 flex-1 text-left">
                    <div className="text-sm font-medium text-white">Account</div>
                    <div className="text-xs text-gray-500">Pro Plan</div>
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full">
                    PRO
                  </span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Overlay */}
      {!collapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;
