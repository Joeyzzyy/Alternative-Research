"use client";

import React, { createContext, useContext, useState } from 'react';

const ToolContext = createContext();

export function ToolProvider({ children }) {
  const [currentTool, setCurrentTool] = useState('research'); // 默认值为 'research'

  const value = {
    currentTool,
    setCurrentTool
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}

export function useToolContext() {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
} 