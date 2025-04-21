// src/components/common/BottomBanner.js
'use client';
import React, { useEffect, useState } from 'react';

export default function BottomBanner({ onClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 检查本地登录状态
    const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn');
    setIsLoggedIn(storedIsLoggedIn === 'true');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      // 延迟2秒后触发动画
      setTimeout(() => setShow(true), 2000);
    }
  }, [isLoggedIn]);

  if (isLoggedIn) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] flex justify-center items-center transition-all duration-500
        ${show ? 'bottom-banner-float-in' : 'opacity-0 translate-y-8'}
      `}
      style={{
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e0e7ff 100%)',
        boxShadow: '0 -2px 8px 0 rgba(129,140,248,0.08)',
        height: '80px',
        fontSize: '0.90rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        borderTop: '1px solid rgba(120,120,120,0.08)',
        backdropFilter: 'blur(1.5px)',
        padding: '0 1.5rem',
      }}
    >
      <span
        style={{
          color: '#333',
          fontWeight: 500,
          fontSize: '0.92em',
          marginRight: '1.2rem',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap'
        }}
      >
        We use cookies to optimize your experience. <span style={{background: 'linear-gradient(90deg,#6366f1,#f0abfc 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700}}>Sign up to generate 5 pages for free</span>. No credit card required, try it now!
      </span>
      <button
        className="ml-2 px-4 py-1.5 rounded-md font-bold shadow transition-all duration-150"
        style={{
          background: 'linear-gradient(90deg, #f0fdfa 0%, #ede9fe 100%)',
          color: '#6d28d9',
          fontSize: '0.92em',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 6px 0 #a21caf11',
        }}
        onClick={onClick}
      >
        Quick Start
      </button>
    </div>
  );
}