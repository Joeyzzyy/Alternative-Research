'use client';
import React, { useState } from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

const UserReviewsWithMovingCards = ({ data, theme = 'normal' }) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const title = data.title;
  const reviews = data.bottomContent;
  const themeStyle = themeConfig[theme];

  // 创建包含首尾克隆的扩展数组
  const extendedReviews = [
    reviews[reviews.length - 1],
    ...reviews,
    reviews[0]
  ];

  const handleTransitionEnd = () => {
    if (activeIndex >= reviews.length + 1) {
      setIsTransitioning(true);
      setActiveIndex(1);
      // 重要：给浏览器一个重绘的机会
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      });
    } else if (activeIndex === 0) {
      setIsTransitioning(true);
      setActiveIndex(reviews.length);
      // 重要：给浏览器一个重绘的机会
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      });
    }
  };

  const handlePrevious = () => {
    if (!isTransitioning) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (!isTransitioning) {
      setActiveIndex(prev => prev + 1);
    }
  };

  return (
    <div className="w-[90%] md:w-[80%] mx-auto py-6 md:py-12">
      {/* 标题和导航按钮区域 */}
      <div className="w-full mx-auto flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
        <h2 className={`text-2xl md:text-3xl font-bold ${themeStyle.textColor} text-center md:text-left`}>
          {title}
        </h2>
        <div className="flex gap-2 md:gap-4">
          {/* Previous 按钮 */}
          <button
            onClick={handlePrevious}
            className={`flex items-center justify-between px-3 md:px-4 py-1.5 rounded-full border ${themeStyle.borderColor} ${themeStyle.textColor} hover:bg-gray-50 transition-colors w-32 md:w-40`}
          >
            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-3 md:w-4 h-3 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
            <span className="flex-1 text-center text-sm md:text-base">Previous</span>
          </button>

          {/* Next 按钮 */}
          <button
            onClick={handleNext}
            className={`flex items-center justify-between px-3 md:px-4 py-1.5 rounded-full border ${themeStyle.borderColor} ${themeStyle.textColor} hover:bg-gray-50 transition-colors w-32 md:w-40`}
          >
            <span className="flex-1 text-center text-sm md:text-base">Next</span>
            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-3 md:w-4 h-3 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* 轮播卡片容器 */}
      <div className="relative w-full mx-auto overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
            transition: isTransitioning ? 'none' : 'transform 500ms ease-in-out'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedReviews.map((review, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-full px-2 md:px-4 transition-all duration-500`}
            >
              <div
                className={`transition-all duration-500 ${
                  index === activeIndex
                    ? 'opacity-100 scale-100'
                    : index === activeIndex - 1 || index === activeIndex + 1
                    ? 'opacity-50 scale-95'
                    : 'opacity-0 scale-90'
                }`}
              >
                {/* 卡片主体 - 移动端改为上下布局 */}
                <div className="w-full md:w-[600px] flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden mx-auto">
                  {/* 上方/左侧用户信息区域 */}
                  <div className="w-full md:w-1/3 h-48 md:h-[300px] relative">
                    {/* 背景图片 */}
                    <div className="absolute inset-0">
                      <Image
                        src={review.avatarUrl}
                        alt={review.avatarAlt}
                        fill
                        className="object-cover md:object-center object-top"
                      />
                      {/* 渐变遮罩 确保文字可读性 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                    
                    {/* 用户信息 - 定位在底部 */}
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h3 className="font-bold text-lg text-white">{review.name}</h3>
                      <p className="text-gray-200 text-sm">{review.position}</p>
                    </div>
                  </div>

                  {/* 下方/右侧评论内容 */}
                  <div className="w-full md:w-2/3 p-4 md:p-8 flex flex-col bg-[#f6f6f6]">
                    {/* 评分部分 */}
                    <div className="flex justify-end mb-4 md:mb-6">
                      {/* 五星评分 */}
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-5 h-5 text-[#2f3337]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* 评论内容部分 */}
                    <div className="mt-auto">
                      <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-800">
                        {review.title}
                      </h4>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        {review.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserReviewsWithMovingCards;