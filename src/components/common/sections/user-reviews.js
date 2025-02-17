'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const UserReviews = ({ data, theme = 'normal' }) => {
  const reviews = data.bottomContent;
  const title = data.title;
  const themeStyle = themeConfig[theme];

  return (
    <div className={`
      ${themeStyle.section.background.primary} 
      ${themeStyle.section.padding.base}
    `}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className={`${themeStyle.typography.h2.fontSize} ${themeStyle.typography.h2.fontWeight} ${themeStyle.typography.h2.color} text-center mb-8`}>
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className={`${themeStyle.card.variants.primary} ${themeStyle.card.padding.md}`}>
              <div className="flex items-center mb-4">
                <img 
                  src={review.avatarUrl}
                  alt={review.avatarAlt}
                  className="w-12 h-12 rounded-full object-contain p-1"
                />
                <div className="ml-4">
                  <h3 className={themeStyle.text.color.primary}>{review.name}</h3>
                  <p className={themeStyle.text.color.secondary}>{review.position}</p>
                </div>
              </div>
              
              <h4 className={`text-lg font-semibold ${themeStyle.text.color.primary} mb-2`}>
                {review.title}
              </h4>
              <p className={themeStyle.typography.paragraph.color}>
                {review.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserReviews;