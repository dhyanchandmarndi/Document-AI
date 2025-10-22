// App.jsx - Updated with query integration
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  // Enhanced responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // md breakpoint
      
      // Auto-collapse sidebar on small screens, but don't force it
      if (width < 1024 && !isMobile) { // lg breakpoint
        setSidebarCollapsed(true);
      } else if (width >= 1280) { // xl breakpoint
        setSidebarCollapsed(false);
      }
    };

    handleResize(); // Check on initial load
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

  // Updated handleSend to support async query callback
  const handleSend = async (userMessage, queryCallback) => {
    // Create user message
    const newMessage = {
      id: Date.now(),
      text: userMessage.text,
      files: userMessage.files,
      timestamp: new Date(),
      aiResponse: null,
      error: false,
      errorMessage: null,
      isLoading: false // Track loading state for this message
    };
    
    // Add user message to state immediately
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-close sidebar on mobile after sending message
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }

    // If there's a query callback (meaning text was sent), execute it
    if (queryCallback) {
      // Set loading state for this message
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, isLoading: true }
          : msg
      ));

      try {
        // Execute the query callback to get AI response
        const aiResponse = await queryCallback();
        
        // Update message with AI response using functional update to avoid stale state
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
      } catch (error) {
        console.error('Query execution error:', error);
        
        // Update message with error state
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

  const handleNewChat = () => {
    setMessages([]);
    // Auto-close sidebar on mobile after new chat
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  // Authentication handlers
  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setIsAuthenticated(true);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setMessages([]);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-[#222222] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#222222] text-white font-sans overflow-hidden">
      {/* Show auth modal if not authenticated */}
      {!isAuthenticated && (
        <AuthModal onLogin={handleLogin} />
      )}
      
      {/* Main app (only show if authenticated) */}
      {isAuthenticated && (
        <>
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            onNewChat={handleNewChat}
            isMobile={isMobile}
            user={user}
            onLogout={handleLogout}
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
