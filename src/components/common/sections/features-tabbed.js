'use client';

import React, { useState } from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

function FeaturesTabbedSection({ data, theme = 'normal' }) {
  const { title, description, bottomContent, buttonText } = data || {};
  const styles = themeConfig[theme];
  
  const [activeTab, setActiveTab] = useState(bottomContent?.[0]?.tabName);
  const activeContent = bottomContent?.find(tab => tab.tabName === activeTab);

  return (
    <section className={`
      ${styles.section.background.primary}
      ${styles.section.padding.base}
    `}>
      {/* Header Section */}
      <header className="text-center mb-6">
        <h2 className={`${styles.typography.h2.fontSize} ${styles.typography.h2.fontWeight} ${styles.typography.h2.color} mb-3`}>
          {title}
        </h2>
        <p className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color} max-w-xl mx-auto`}>
          {description}
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="border-gray-200 border-b mb-6">
        <div className="flex -mb-px justify-center">
          {bottomContent?.map((tab) => (
            <button
              key={`tab-${tab.tabName}`}
              onClick={() => setActiveTab(tab.tabName)}
              className={`
                ${styles.typography.caption.fontSize} px-6 py-3 
                border-b-2 
                transition-colors duration-200
                ${activeTab === tab.tabName
                  ? `border-[${styles.colors?.accent}] ${styles.text.color.accent} ${styles.typography.caption.fontWeight}`
                  : `border-transparent ${styles.text.color.secondary} hover:${styles.text.color.primary} hover:border-gray-300`
                }
              `}
            >
              {tab.tabName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6"
           style={{ flexDirection: activeContent?.imageOnRight ? 'row' : 'row-reverse' }}>
        {/* 内容部分始终在左侧 */}
        <div className="w-full md:w-1/3 space-y-3">
          <h3 className={`${styles.typography.h3.fontSize} ${styles.typography.h3.fontWeight} ${styles.typography.h3.color}`}>
            {activeContent?.title}
          </h3>
          <p className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color} whitespace-pre-line`}>
            {activeContent?.description}
          </p>
          <button 
            className={`${styles.button.base} ${styles.button.variants.primary} hover:scale-105 ${styles.button.sizes.sm}`}
            onClick={() => activeContent?.buttonLink && window.open(activeContent.buttonLink, '_blank')}
          >
            {activeContent?.buttonText}
          </button>
        </div>

        {/* 图片部分 */}
        <div className="w-full md:w-1/3">
          <div className="rounded-lg overflow-hidden">
            {activeContent?.imageUrl && (
              <Image 
                src={activeContent.imageUrl}
                alt={activeContent.imageAlt || ''}
                width={400}
                height={300}
                className="w-full h-auto max-w-sm mx-auto object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesTabbedSection;

