'use client';

import React from 'react';

const WhyChooseUsWithSmallBlocks = ({ data }) => {
  const { topContent, bottomContent } = data;
  const { title, description } = topContent;

  return (
    <div className="
      w-[95%] mx-auto
      bg-[#f5f6f7]
      rounded-2xl
      mb-10
      py-12 md:py-16
    ">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center md:items-center">
          {bottomContent.map((module, index) => (
            <React.Fragment key={index}>
              <div className="flex-1 text-center flex flex-col mb-8 md:mb-0">
                {/* 上层 - 标题 */}
                <div className="mb-3 md:mb-4">
                  <p className="text-gray-500 text-sm md:text-base">{module.topText}</p>
                </div>
                
                {/* 中层 - 主要内容 */}
                <div className="mb-3 md:mb-4">
                  <div className="text-xl md:text-3xl font-semibold">
                    {module.middleText}
                  </div>
                </div>
                
                {/* 下层 - 描述 */}
                <div>
                  <p className="text-gray-500 text-sm md:text-base">{module.bottomText}</p>
                </div>
              </div>
              {index < bottomContent.length - 1 && (
                <div className="hidden md:block h-20 w-px bg-black mx-4 self-center"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUsWithSmallBlocks;