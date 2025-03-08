'use client';
import React, { useEffect, useMemo, memo } from 'react';
import Header from './header-template';
import Footer from './footer-template';
/* divider */
import FAQ from '../common/sections/faq-standard';
import CallToAction from '../common/sections/call-to-action';
import ProductBenefitsWithBlocks from '../common/sections/product-benefits-with-blocks';
import ResearchTool from '../common/sections/research-tool';

const COMPONENT_MAP = {
  ProductBenefitsWithBlocks: ProductBenefitsWithBlocks,
  Faqs: FAQ,
  CallToAction: CallToAction,
  ResearchTool: ResearchTool,
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
  const headerData = useMemo(() => {
    return article?.pageLayout?.pageHeaders;
  }, [article?.pageLayout?.pageHeaders]);

  const footerData = useMemo(() => {
    return article?.pageLayout?.pageFooters;
  }, [article?.pageLayout?.pageFooters]);

  useEffect(() => {
  }, [article]);

  if (!article) {
    return null;
  }

  const sections = article?.sections || [];
  const author = article?.author || 'default';

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col">
      {headerData && (
        <Header 
          data={headerData}
        />
      )}
      
      <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {sections.map((section, index) => {
          const Component = COMPONENT_MAP[section.componentName];
          if (!Component) return null;

          // 为 ResearchTool 组件添加特殊样式
        const sectionClassName = section.componentName === "ResearchTool" 
          ? "w-full bg-white" // 移除顶部内边距
          : "w-full bg-white";
      
          
          return (
            <div 
              key={`${section.componentName}-${section.sectionId}`}
              className={sectionClassName}
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
    </div>
  );
};

export default memo(CommonLayout);