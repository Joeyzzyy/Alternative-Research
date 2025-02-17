'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';
import { format } from 'date-fns';

const TitleSection = ({ data, theme = 'normal' }) => {
  const styles = themeConfig[theme];
  const { title, subTitle, bottomContent } = data || {};
  const { author, publishDate } = bottomContent || {};

  return (
    <div className={`
      relative z-10 
      ${styles.section.background.primary} 
      ${styles.section.padding.base}
    `}>
      <header className="w-full">
        <div className="w-full max-w-4xl mx-auto px-4 text-center">
          {title && (
            <h1 className={`${styles.typography.h1.fontSize} ${styles.typography.h1.fontWeight} ${styles.typography.h1.color} mb-4`}>
              {title}
            </h1>
          )}
          {subTitle && (
            <h2 className={`${styles.typography.h3.fontSize} font-normal text-gray-500 text-base mb-6`}>
              {subTitle}
            </h2>
          )}
          <div className="flex items-center justify-center gap-2">
            {author && (
              <div className="flex items-center">
                <span className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color}`}>
                  By {author}
                </span>
              </div>
            )}
            {author && publishDate && (
              <div className="mx-2 h-4 w-px bg-gray-300"></div>
            )}
            {publishDate && (
              <div className="flex items-center">
                <span className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color}`}>
                  {format(new Date(publishDate), 'yyyy-MM-dd HH:mm')}
                </span>
                <span className="mx-2 text-gray-500">•</span>
                <span className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color}`}>
                  5 mins read
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default TitleSection;