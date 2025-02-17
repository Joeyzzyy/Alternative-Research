'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

const UserReviewsWithSquareCards = ({ data, theme = 'normal' }) => {
  const title = data.title;
  const reviews = data.bottomContent;
  const themeStyle = themeConfig[theme];

  const getStarColor = () => {
    return theme === 'tech' ? 'text-indigo-500' : 'text-[#3374FF]';
  };

  return (
    <div className={`
      ${themeStyle.section.background.primary} 
      ${themeStyle.section.padding.base}
    `}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className={`${themeStyle.typography.h2.fontSize} ${themeStyle.typography.h2.fontWeight} ${themeStyle.typography.h2.color} text-center mb-8`}>
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className={`${themeStyle.card.variants.primary} ${themeStyle.card.padding.lg} flex flex-col h-full`}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${getStarColor()}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <h4 className={`text-lg font-semibold ${themeStyle.text.color.primary} mb-2`}>
                {review.title}
              </h4>
              
              <p className={`${themeStyle.typography.paragraph.fontSize} ${themeStyle.typography.paragraph.color} mb-6 flex-grow`}>
                {review.content}
              </p>
              
              <div className="flex items-center mt-4">
                {review.avatarUrl && (
                  <Image 
                    src={review.avatarUrl}
                    alt={review.avatarAlt || ''}
                    width={48}
                    height={48}
                    className="rounded-full object-contain"
                  />
                )}
                <div className="ml-4">
                  <h3 className={themeStyle.text.color.primary}>{review.name}</h3>
                  <p className={themeStyle.text.color.secondary}>{review.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserReviewsWithSquareCards;