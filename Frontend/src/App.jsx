// App.jsx
import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from 'jwt-decode';
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import AuthModal from "./components/AuthModal";
import useConversations from "./hooks/useConversations";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // NEW: Chat history state
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const { createConversation, fetchConversations } = useConversations();

  // ADD: Ref to access sidebar's fetchConversations
  const sidebarRefreshRef = useRef(null);

  // Token validation
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          console.log('Token expired, please login again');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
        } else {
          setAuthToken(token);
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 1024 && !isMobile) {
        setSidebarCollapsed(true);
      } else if (width >= 1280) {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Updated handleSend with conversation support
  const handleSend = async (userMessage, queryCallback) => {
    const newMessage = {
      id: Date.now(),
      text: userMessage.text,
      files: userMessage.files,
      timestamp: new Date(),
      aiResponse: null,
      error: false,
      errorMessage: null,
      isLoading: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }

    if (queryCallback) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, isLoading: true }
          : msg
      ));

      try {
        // CREATE CONVERSATION IF IT DOESN'T EXIST
        let conversationIdToUse = currentConversationId;
        
        if (!conversationIdToUse) {
          console.log('Creating new conversation for first query...');
          const newConversation = await createConversation();
          conversationIdToUse = newConversation.id;
          setCurrentConversationId(conversationIdToUse);
          console.log('New conversation created:', conversationIdToUse);
        }

        // Pass conversationId to query callback
        const aiResponse = await queryCallback(conversationIdToUse);
        
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { 
                ...msg, 
                aiResponse: aiResponse,
                isLoading: false,
                error: aiResponse.error || false,
                errorMessage: aiResponse.error ? aiResponse.message : null
              }
            : msg
        ));
        // ADD: Refresh sidebar after successful query
        if (sidebarRefreshRef.current) {
          sidebarRefreshRef.current();
        }
      } catch (error) {
        console.error('Query execution error:', error);
        
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { 
                ...msg, 
                isLoading: false,
                error: true,
                errorMessage: error.message || 'Failed to process query'
              }
            : msg
        ));
      }
    }
  };

  // NEW: Handle new chat - creates conversation
  const handleNewChat = async () => {
    try {
      // Clear state
      setCurrentConversationId(null);
      
      // Clear messages
      setMessages([]);
      
      // Close sidebar on mobile
      if (isMobile) {
        setSidebarCollapsed(true);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Fallback: just clear messages
      setCurrentConversationId(null);
      setMessages([]);
      if (isMobile) {
        setSidebarCollapsed(true);
      }
    }
  };

  // NEW: Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    try {
      setCurrentConversationId(conversation.id);
      
      // Fetch conversation messages
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/chat/conversations/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const conversationData = result.data;
        
        // Convert messages to display format
        const loadedMessages = conversationData.messages.map(msg => ({
          id: msg.id,
          text: msg.query_text,
          files: msg.document_ids ? msg.document_ids.map(id => ({ documentId: id })) : [],
          timestamp: new Date(msg.created_at),
          aiResponse: msg.ai_response ? {
            answer: msg.ai_response,
            retrieval: {
              chunks: [],
              processingTime: msg.processing_time
            },
            ai: {
              model: msg.model_name,
              sourcesUsed: msg.chunks_used
            }
          } : null,
          error: msg.error,
          errorMessage: msg.error_message,
          isLoading: false
        }));
        
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setIsAuthenticated(true);
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setMessages([]);
    setCurrentConversationId(null);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#222222] text-white font-sans overflow-hidden">
      {!isAuthenticated && (
        <AuthModal onLogin={handleLogin} />
      )}
      
      {isAuthenticated && (
        <>
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            onNewChat={handleNewChat}
            isMobile={isMobile}
            user={user}
            onLogout={handleLogout}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onMountRefresh={(refreshFn) => { sidebarRefreshRef.current = refreshFn; }}
          />
          
          <div className={`h-full transition-all duration-300 ${
            isMobile 
              ? 'ml-0'
              : (sidebarCollapsed ? 'ml-16' : 'ml-64')
          }`}>
            <MainContent 
              messages={messages}
              onSend={handleSend}
              sidebarCollapsed={sidebarCollapsed}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              user={user}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </>
      )}
    </div>
  );
}
