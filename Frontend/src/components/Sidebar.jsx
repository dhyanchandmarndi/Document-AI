// components/Sidebar.jsx
import React from "react";

const Sidebar = ({ collapsed, onToggle, onNewChat }) => {
  const historyItems = [
    "Chat about Q3 Financials",
    "Analysis of Marketing Campaign", 
    "New Project Proposal Insights"
  ];

  return (
    <div className={`flex flex-col bg-[#222222] p-4 border-r border-gray-700 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0">
        <div className={`flex items-center mb-6 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!collapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold">DocumentAI</span>
            </div>
          )}
          <button 
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center p-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 mb-6 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!collapsed && <span className="ml-2">New Chat</span>}
        </button>

        {/* Navigation */}
        <nav className="space-y-2">
          <a className="flex items-center p-3 text-white bg-gray-800 rounded-xl transition-colors" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!collapsed && <span className="ml-3">Home</span>}
          </a>
          
          <a className="flex items-center p-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!collapsed && <span className="ml-3">Discover</span>}
          </a>

          <a className="flex items-center p-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {!collapsed && <span className="ml-3">Spaces</span>}
          </a>
        </nav>

        {/* History Section */}
        {!collapsed && (
          <div className="mt-8">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              History
            </h3>
            <div className="mt-3 space-y-1">
              {historyItems.map((item, index) => (
                <a
                  key={index}
                  className="block p-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg truncate transition-colors"
                  href="#"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto space-y-2">
        <a className="flex items-center p-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors" href="#">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V17z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 14H4a1 1 0 01-1-1V7a1 1 0 011-1h6.5" />
          </svg>
          {!collapsed && <span className="ml-3">Notifications</span>}
        </a>

        <a className="flex items-center p-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors" href="#">
          <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          {!collapsed && (
            <>
              <span className="ml-3">Account</span>
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold text-white bg-cyan-500 rounded-full">
                PRO
              </span>
            </>
          )}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
