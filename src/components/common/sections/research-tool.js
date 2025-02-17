'use client';
import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="text-center relative z-10 max-w-4xl">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-100 to-indigo-200 animate-gradient">
          The Best SaaS Alternative Research Tool
        </h1>
        <p className="text-purple-100 text-xl mb-8 leading-relaxed">
          A powerful space ready for your next-generation solution
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 mx-auto rounded-full mb-8"></div>
      </div>
    </div>
  );
};

export default ResearchTool; 