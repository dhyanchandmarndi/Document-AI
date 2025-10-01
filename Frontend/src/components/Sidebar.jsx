// components/Sidebar.jsx
import React, { useState, useRef, useEffect } from "react";

const Sidebar = ({ collapsed, onToggle, onNewChat, isMobile, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Sample chat history
  const chatHistory = [
    "Financial Report Analysis Q3 2024",
    "Marketing Campaign Performance Review",
    "Project Proposal Risk Assessment",
    "Customer Feedback Summary Document",
    "Quarterly Sales Data Analysis",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Handle logout with menu close
  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-[#222222] border-r border-gray-700 z-30 transition-all duration-300 ${
        isMobile 
          ? `w-80 ${collapsed ? '-translate-x-full' : 'translate-x-0'}` // Mobile: slide in/out
          : `${collapsed ? 'w-16' : 'w-64'}` // Desktop: collapse/expand
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

          {/* New Chat Button */}
          <div className="flex-shrink-0 p-4">
            <button 
              onClick={onNewChat}
              className={`w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 ${
                collapsed && !isMobile ? 'px-2' : 'px-3'
              }`}
              title="Start new chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {(!collapsed || isMobile) && <span className="ml-2">New Chat</span>}
            </button>
          </div>

          {/* Chat History - Scrollable Section */}
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

          {/* User Account Section - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700/50 relative" ref={userMenuRef}>
            {/* User Info Button - Expanded state */}
            {user && (!collapsed || isMobile) && (
              <button 
                onClick={toggleUserMenu}
                className="w-full p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* User Info Button - Collapsed state */}
            {user && collapsed && !isMobile && (
              <button 
                onClick={toggleUserMenu}
                className="w-full flex justify-center hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                title={`${user.name || 'User'} - Click for options`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </button>
            )}

            {/* Dropdown Menu */}
            {showUserMenu && (!collapsed || isMobile) && (
              <div className={`absolute bottom-full left-4 right-4 mb-2 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl z-50 ${
                collapsed && !isMobile ? 'left-2 right-2' : ''
              }`}>
                {/* User info in dropdown (for collapsed state) */}
                {collapsed && !isMobile && (
                  <div className="p-3 border-b border-gray-600">
                    <div className="text-sm font-medium text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                )}
                
                {/* Menu items */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
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
