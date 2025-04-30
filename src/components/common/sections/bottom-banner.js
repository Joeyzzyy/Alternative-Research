// src/components/common/BottomBanner.js
'use client';
import React, { useEffect, useState } from 'react';

export default function BottomBanner({ onClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [show, setShow] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isVisible, setIsVisible] = useState(true);

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

  useEffect(() => {
    const handleLoginSuccess = () => {
      // 重新获取登录信息
      const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn');
      const storedEmail = localStorage.getItem('alternativelyCustomerEmail');
      if (storedIsLoggedIn === 'true' && storedEmail) {
        setIsLoggedIn(true);
        setUserEmail(storedEmail);
        setIsVisible(false);
      }
    };
    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, []);

  if (isLoggedIn || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] flex flex-col sm:flex-row justify-center items-center transition-all duration-500
        ${show ? 'bottom-banner-float-in' : 'opacity-0 translate-y-full sm:translate-y-8'}
        h-auto py-4 sm:h-20 sm:py-0 px-4 sm:px-6
      `}
      style={{
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e0e7ff 100%)',
        boxShadow: '0 -2px 8px 0 rgba(129,140,248,0.08)',
        fontSize: '0.90rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        borderTop: '1px solid rgba(120,120,120,0.08)',
        backdropFilter: 'blur(1.5px)',
      }}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:mr-2 text-gray-500 hover:text-gray-700 transition-colors"
        style={{
          fontSize: '1.2rem',
          lineHeight: '1',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.2rem 0.5rem',
        }}
        aria-label="Close Banner"
      >
        &times;
      </button>
      <span
        className="text-center sm:text-left text-sm sm:text-[0.92em] mb-3 sm:mb-0 sm:mr-4 whitespace-normal sm:whitespace-nowrap"
        style={{
          color: '#333',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        Turn competitor searches into customers - start for free.
      </span>
      <button
        className="mt-2 sm:mt-0 sm:ml-2 px-4 py-1.5 rounded-md font-bold shadow transition-all duration-150 text-sm sm:text-[0.92em]"
        style={{
          background: 'linear-gradient(90deg, #f0fdfa 0%, #ede9fe 100%)',
          color: '#6d28d9',
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