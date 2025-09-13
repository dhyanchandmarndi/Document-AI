// App.jsx
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);

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
    <div className="flex h-screen bg-[#222222] text-white font-sans">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
      />
      <MainContent 
        messages={messages}
        onSend={handleSend}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
}
