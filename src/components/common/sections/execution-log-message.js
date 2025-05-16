import React, { useEffect, useRef } from 'react';
import { formatTimestamp } from './utils'; // 假设你有这样的工具函数
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // 选择一个主题

const ExecutionLogMessage = ({ logs }) => {
  const codeContainerRef = useRef(null);

  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const renderLogContent = (log) => {
    const content = log.content;
    switch (log.type) {
      case 'Info':
      case 'Error':
        return <span className={log.type === 'Error' ? 'text-red-400' : 'text-gray-300'}>{typeof content === 'string' ? content : JSON.stringify(content)}</span>;
      case 'Html':
        return (
          <SyntaxHighlighter language="htmlbars" style={atomOneDark} customStyle={{ background: 'transparent', padding: '0.5em' }}>
            {String(content)}
          </SyntaxHighlighter>
        );
      case 'Color':
         // 假设 Color 内容是 JSON 字符串或对象
        return (
          <SyntaxHighlighter language="json" style={atomOneDark} customStyle={{ background: 'transparent', padding: '0.5em' }}>
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </SyntaxHighlighter>
        );
      case 'Codes':
        // 假设 Codes 内容是 JSON 字符串或对象
        return (
          <SyntaxHighlighter language="json" style={atomOneDark} customStyle={{ background: 'transparent', padding: '0.5em' }}>
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </SyntaxHighlighter>
        );
      case 'Crawler_Images':
      case 'Crawler_Headers':
      case 'Crawler_Footers':
        // 假设这些内容是数组或对象
        return (
          <SyntaxHighlighter language="json" style={atomOneDark} customStyle={{ background: 'transparent', padding: '0.5em' }}>
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </SyntaxHighlighter>
        );
      default:
        return <span className="text-gray-400">{typeof content === 'string' ? content : JSON.stringify(content)}</span>;
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center text-slate-500 text-sm">
        Waiting for execution logs...
      </div>
    );
  }

  return (
    <div className="w-full h-80 overflow-hidden bg-slate-800/70 backdrop-blur-md rounded-lg shadow-lg border border-slate-700/50 flex flex-col text-xs mb-4">
      <div className="p-3 border-b border-slate-700 text-slate-300 font-medium">
        Execution Log
      </div>
      <div ref={codeContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {logs.map((log, index) => (
          <div key={log.id || index} className="flex items-start">
            <span className="text-slate-500 mr-2 whitespace-nowrap">
              [{formatTimestamp(log.timestamp || new Date().toISOString())}]
            </span>
            <span className={`mr-2 font-semibold ${
              log.type === 'Error' ? 'text-red-500' :
              log.type === 'Info' ? 'text-blue-400' :
              log.type === 'Html' ? 'text-green-400' :
              log.type === 'Color' ? 'text-purple-400' :
              log.type === 'Codes' ? 'text-yellow-400' :
              'text-sky-400' // Default for Crawler types etc.
            }`}>
              [{log.type}]
            </span>
            <div className="flex-1 min-w-0 break-words">
              {renderLogContent(log)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionLogMessage;