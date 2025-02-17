'use client';
import React from 'react';
import { Input } from 'antd';
import themeConfig from '../../../styles/themeConfig';

const CallToActionWithInput = ({ data, theme = 'normal' }) => {
  const { typography, section } = themeConfig[theme];

  return (
    <div className={`${section.background.primary} ${section.padding.base} flex items-center justify-center px-4 py-24`}>
      <div className="max-w-[90%] w-full space-y-16">
        <div className="bg-gradient-to-b from-[#3374FF] to-[#1F4699] rounded-2xl p-16 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-12 text-center">
              {data.title}
            </h2>
            <div className="flex items-center justify-center">
              <div className="relative w-[480px]">
                <Input 
                  placeholder={data?.bottomContent?.inputPlaceholder || 'Enter your email address'}
                  className="w-full bg-white border-none text-sm h-[52px] px-6 rounded-[26px] placeholder-gray-400"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-black text-white px-6 py-3 rounded-[22px] hover:bg-gray-800 transition-colors">
                  {data?.buttonText || 'Get Started'}
                </button>
              </div>
            </div>
            <p className="text-white text-sm mt-10 text-center">
              {data?.bottomContent?.smallText || 'We respect your privacy and keep your data secure'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToActionWithInput;

