'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const FAQTwoColumnsWithSmallTitle = ({ data, theme = 'normal' }) => {
  const styles = themeConfig[theme];

  return (
    <div className={`
      ${styles.section.background.primary} 
      ${styles.section.padding.base}
    `}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 
            to-purple-600 bg-clip-text text-transparent">
            Frequently asked questions
          </h2>
        </div>

        <div className="grid grid-cols-1">
          {data.topContent.map((faq, index) => (
            <div key={index} className={`border-b border-gray-200 py-6 ${index === 0 ? 'border-t' : ''}`}>
              <div className="flex flex-col md:flex-row md:gap-8">
                <div className="md:w-1/2">
                  <div className={`${styles.typography.paragraph.color} font-medium mb-2`}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className={`${styles.typography.paragraph.fontSize} ${styles.typography.h3.fontWeight} ${styles.typography.h3.color} mb-4 md:mb-0`}>
                    {faq.question}
                  </h3>
                </div>
                <div className="md:w-1/2">
                  <p className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color} whitespace-pre-line`}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.bottomContent.showButton && (
          <div className="flex justify-center mt-12">
            <a 
              href={data.bottomContent.buttonLink}
              className="text-base bg-gradient-to-r from-blue-600 to-purple-600 
                bg-clip-text text-transparent inline-flex items-center gap-1 
                cursor-pointer hover:opacity-80"
            >
              {data.bottomContent.buttonText} {'>'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQTwoColumnsWithSmallTitle;