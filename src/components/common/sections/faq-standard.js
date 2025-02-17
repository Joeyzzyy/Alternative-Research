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
          <h2 className={`${styles.typography.h3.fontSize} ${styles.typography.h2.fontWeight} ${styles.typography.h2.color}`}>
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
              className={`
                ${styles.typography.paragraph.fontSize}
                text-[#0066FF]
                inline-flex 
                items-center 
                gap-1 
                cursor-pointer
                hover:opacity-80
              `}
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