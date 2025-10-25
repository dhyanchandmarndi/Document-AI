// components/Sidebar.jsx
import React, { useState, useRef, useEffect } from "react";
import useConversations from "../hooks/useConversations";
import ConfirmModal from "./ConfirmModal";

const Sidebar = ({ 
  collapsed, 
  onToggle, 
  onNewChat, 
  isMobile, 
  user, 
  onLogout,
  currentConversationId,  // NEW: Track active conversation
  onSelectConversation,    // NEW: Handle conversation selection
  onMountRefresh        // NEW: Pass refresh function to parent
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const userMenuRef = useRef(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, conversationId: null, title: '' });

  // Use conversations hook
  const { conversations, loading, error, fetchConversations, deleteConversation } = useConversations();

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

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
  
  // Provide fetchConversations to parent on mount
  useEffect(() => {
    if (onMountRefresh) {
      onMountRefresh(fetchConversations);
    }
  }, [onMountRefresh, fetchConversations]);

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Handle logout with menu close
  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  const handleDeleteConversation = (e, conversation) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      conversationId: conversation.id,
      title: conversation.title
    });
  };

  // ✅ ADD: Confirm delete action
  const confirmDelete = async () => {
    const conversationId = deleteConfirm.conversationId;
    setDeleteConfirm({ isOpen: false, conversationId: null, title: '' });
    
    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
      
      if (conversationId === currentConversationId) {
        onNewChat();
      }
    } catch (error) {
      alert('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, conversationId: null, title: '' });
  };

  const handleSelectConversation = (conversation) => {
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
    
    // Close sidebar on mobile after selection
    if (isMobile && !collapsed) {
      onToggle();
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Conversation?"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-[#222222] border-r border-gray-700 z-30 transition-all duration-300 ${
        isMobile 
          ? `w-80 ${collapsed ? '-translate-x-full' : 'translate-x-0'}`
          : `${collapsed ? 'w-16' : 'w-64'}`
      }`}>
        <div className="flex flex-col h-full">
          
          {/* Header Section */}
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
              {loading && (!collapsed || isMobile) ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-400 text-sm">
                  {error}
                </div>
              ) : conversations.length === 0 ? (
                (!collapsed || isMobile) && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No conversations yet
                  </div>
                )
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full text-left p-3 text-sm rounded-lg transition-all duration-200 group relative ${
                        conversation.id === currentConversationId
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                      } ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}
                      title={collapsed && !isMobile ? conversation.title : ""}
                      disabled={deletingId === conversation.id}
                    >
                      <div className={`flex items-center ${
                        collapsed && !isMobile ? 'justify-center' : 'justify-between'
                      }`}>
                        <div className="flex items-center min-w-0 flex-1">
                          <svg className={`flex-shrink-0 ${
                            conversation.id === currentConversationId ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'
                          } ${collapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.646-.388l-2.729 1.093a.5.5 0 01-.67-.65L8.051 17.95A8 8 0 1121 12z" />
                          </svg>
                          {(!collapsed || isMobile) && (
                            <span className="ml-3 truncate leading-5 flex-1">
                              {conversation.title}
                            </span>
                          )}
                        </div>
                        
                        {/* Delete button */}
                        {(!collapsed || isMobile) && (
                          <button
                            onClick={(e) => handleDeleteConversation(e, conversation)}
                            className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                            title="Delete conversation"
                            disabled={deletingId === conversation.id}
                          >
                            {deletingId === conversation.id ? (
                              <div className="w-4 h-4 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
