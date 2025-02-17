"use client";
import { useState } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Header() {

  const [state, setState] = useState({
    isOpen: false,
    activeDropdown: null
  });

  const renderMenuItem = (item) => {
    if (!item?.label) return null;

    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const menuItemStyles = {
      color: item.color || 'text-gray-600',
      fontWeight: item.fontWeight || 'normal'
    };
    
    return (
      <div 
        key={item.key || item.label}
        className="relative group"
      >
        {hasChildren ? (
          <a
            href={item.link || '#'}
            style={menuItemStyles}
            className="text-[15px] hover:text-[#1890ff] transition-all duration-300 flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        ) : (
          <a
            href={item.link || `#${item.label.toLowerCase()}`}
            style={menuItemStyles}
            className="text-[15px] hover:text-[#1890ff] transition-all duration-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
          </a>
        )}

        {hasChildren && (
          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-40 bg-white shadow-lg rounded-lg py-1 mt-1 transition-all duration-200">
            {item.children.map((child) => (
              <a
                key={child.key || child.label}
                href={child.href}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-[#1890ff] hover:bg-gray-50"
                target="_blank"
                rel="noopener noreferrer"
              >
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  const mainMenuItems = [
    {
      label: "Pricing",
      color: "#000000",
      fontWeight: "600",
      link: "https://websitelm.com/pricing"
    },
    {
      label: "FAQ",
      color: "#000000", 
      fontWeight: "600",
      link: "https://websitelm.com/faq"
    }
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "#FFFFFF"
      }}
    >
      <div className="max-w-[1450px] mx-auto px-6">
        <div className="flex items-center justify-between h-[4.2rem]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center h-full">
            <a href="/" className="flex items-center h-full py-2" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/alternatively-logo-tem.png"
                alt="Logo"
                width={160}
                height={40}
                className="object-contain"
                quality={100}
                priority
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex gap-8">
              {mainMenuItems.map(renderMenuItem)}
            </div>
          </div>

          {/* Action Items */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => window.open('https://accounts.google.com/o/oauth2/v2/auth', '_blank')}
              className="px-4 py-2 rounded-lg bg-white text-[#DD33FF] hover:opacity-90 border border-[#DD33FF] cursor-pointer text-[15px] font-medium transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setState({ ...state, isOpen: !state.isOpen })}
              className="p-2 rounded-md cursor-pointer"
            >
              <span className="sr-only">Open menu</span>
              {!state.isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 添加移动端菜单 */}
        {state.isOpen && (
          <div className="md:hidden absolute top-[4.2rem] left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
            <div className="py-4 px-6">
              <div className="space-y-3">
                {mainMenuItems.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="text-[15px] font-medium">{item.label}</div>
                    {item.children?.length > 0 && (
                      <div className="pl-4 space-y-2">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            className="block text-sm text-gray-600 hover:text-[#3374FF]"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}