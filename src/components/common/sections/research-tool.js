'use client';
import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  return (
    <div className="w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-[600px] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Build Your Tool Here
        </h1>
        <p className="text-gray-400 text-lg">
          A powerful space ready for your next-generation solution
        </p>
      </div>
    </div>
  );
};

export default ResearchTool; 