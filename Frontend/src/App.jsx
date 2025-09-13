// App.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSend = ({ text, files }) => {
    const newMessage = {
      id: Date.now(),
      text,
      files,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-close sidebar on mobile after sending message
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    // Auto-close sidebar on mobile after new chat
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="h-screen bg-[#222222] text-white font-sans overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
        isMobile={isMobile}
      />
      
      {/* Main content with responsive margins */}
      <div className={`h-full transition-all duration-300 ${
        isMobile 
          ? 'ml-0' // No margin on mobile - sidebar overlays
          : (sidebarCollapsed ? 'ml-16' : 'ml-64') // Desktop margins
      }`}>
        <MainContent 
          messages={messages}
          onSend={handleSend}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          onToggleSidebar={toggleSidebar}
        />
      </div>
    </div>
  );
}
