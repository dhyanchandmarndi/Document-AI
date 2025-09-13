// App.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Check on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen bg-[#222222] text-white font-sans overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
      />
      
      {/* Main content with proper margin */}
      <div className={`h-full transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <MainContent 
          messages={messages}
          onSend={handleSend}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>
    </div>
  );
}
