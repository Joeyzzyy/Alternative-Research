'use client';

import React from 'react';

const HowItWorksWithBlocks = ({ data, author }) => {
  const { leftContent, rightContent } = data;

  return (
    <div className="bg-[#e6eeff] py-16">
      <div className="w-[85%] mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          <div className="w-full md:w-1/3">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {leftContent.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {leftContent.subTitle}
            </p>
            <a 
              href={leftContent.buttonLink}
              className="inline-flex items-center px-6 py-3 bg-[#3374FF] text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300"
            >
              {leftContent.buttonText}
            </a>
          </div>

          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {rightContent.map((block, index) => (
                <div key={index} className="p-6 border-t-0 sm:border-t border-[#86909c]">
                  <div className="text-lg font-semibold text-[#3374FF] mb-2">
                    {`0${index + 1}`}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {block.contentTitle}
                  </h3>
                  <p className="text-sm text-[#2f3337] leading-relaxed">
                    {block.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksWithBlocks;