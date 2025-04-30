'use client';
import React, { useEffect, useMemo, memo, useState } from 'react';
import Header from './header-template';
import Footer from './footer-template';
/* divider */
import FAQ from '../common/sections/faq-standard';
import CallToAction from '../common/sections/call-to-action';
import ResearchTool from '../common/sections/research-tool';
import SubscriptionCard from '../common/sections/subscription-card';
import FeatureIntro from '../common/sections/feature-intro';
import HowItWorks from '../common/sections/how-it-works';
import Recommendations from '../common/sections/recommendations';
import ShowCase from '../common/sections/show-case';
import ResultPreview from '../common/sections/result-preview';
import { useToolContext } from '../../contexts/ToolContext';
import BottomBanner from '../common/sections/bottom-banner';
import CompareTable from '../common/sections/compare-table';
import KeyAdvantages from '../common/sections/key-advantages';

const COMPONENT_MAP = {
  Faqs: FAQ,
  CallToAction: CallToAction,
  ResearchTool: ResearchTool,
  SubscriptionCard: SubscriptionCard,
  FeatureIntro: FeatureIntro,
  Recommendations: Recommendations,
  ResultPreview: ResultPreview,
  ShowCase: ShowCase,
  HowItWorks: HowItWorks,
  CompareTable: CompareTable,
  KeyAdvantages: KeyAdvantages,
};

const generateSchemaMarkup = (article) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author
    },
    datePublished: article.publishDate,
    image: article.ogImage,
    dateModified: article.updateDate,
    publisher: {
      '@type': 'Organization',
      name: 'WebsiteLM'
    }
  };
};

const CommonLayout = ({ article, keywords }) => {
  const { currentTool } = useToolContext();
  const headerData = useMemo(() => {
    return article?.pageLayout?.pageHeaders;
  }, [article?.pageLayout?.pageHeaders]);

  const footerData = useMemo(() => {
    return article?.pageLayout?.pageFooters;
  }, [article?.pageLayout?.pageFooters]);

  const [targetShowcaseTab, setTargetShowcaseTab] = useState(null);

  useEffect(() => {
  }, [article]);

  if (!article) {
    return null;
  }

  const sections = article?.sections || [];
  const author = article?.author || 'default';

  // 新增：处理底部banner点击，弹出登录框
  const handleBottomBannerClick = () => {
    window.dispatchEvent(new Event('showAlternativelyLoginModal'));
  };

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col">
      {headerData && (
        <Header 
          data={headerData}
        />
      )}
      
      <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {sections.map((section, index) => {
          if (section.componentName === "ResearchTool") {
            return (
              <div 
                key={`tool-section-${index}`}
                className="w-full bg-white"
              >
                {currentTool === 'restore' ? (
                  <TaskRestoreTool />
                ) : (
                  <ResearchTool setTargetShowcaseTab={setTargetShowcaseTab} />
                )}
              </div>
            );
          }

          const Component = COMPONENT_MAP[section.componentName];
          if (!Component) return null;

          if (section.componentName === "ShowCase") {
            return (
              <div
                key={`${section.componentName}-${section.sectionId}`}
                className="w-full bg-white"
                id={section.sectionId}
              >
                <Component
                  data={section}
                  author={author}
                  date={article.createdAt}
                  targetKey={targetShowcaseTab}
                  initialActiveKey="hix"
                />
              </div>
            );
          }

          if (section.componentName === "SubscriptionCard") {
            return (
              <div
                key={`${section.componentName}-${section.sectionId}`}
                className="w-full bg-white"
                id={section.sectionId}
              >
                <Component
                  data={section}
                  author={author}
                  date={article.createdAt}
                />
              </div>
            );
          }

          return (
            <div 
              key={`${section.componentName}-${section.sectionId}`}
              className="w-full bg-white"
              id={section.sectionId}
            >
              <Component 
                data={section}
                author={author}
                date={article.createdAt}
              />
            </div>
          );
        })}
      </div>

      {footerData && (
        <Footer 
          data={footerData}
        />
      )}
      {/* 新增底部横幅 */}
      <BottomBanner onClick={handleBottomBannerClick} />
    </div>
  );
};

export default memo(CommonLayout);