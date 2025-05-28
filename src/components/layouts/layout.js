'use client';
import React, { useEffect, useMemo, memo, useState } from 'react';
import { Modal } from 'antd';
import Header from './header-template';
import Footer from './footer-template';
/* divider */
import FAQ from '../common/sections/faq-standard';
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
import ResearchToolRecover from '../common/sections/research-tool-recover';
import apiClient from '../../lib/api/index.js';

const COMPONENT_MAP = {
  Faqs: FAQ,
  ResearchTool: ResearchTool,
  SubscriptionCard: SubscriptionCard,
  FeatureIntro: FeatureIntro,
  Recommendations: Recommendations,
  ResultPreview: ResultPreview,
  ShowCase: ShowCase,
  HowItWorks: HowItWorks,
  CompareTable: CompareTable,
  KeyAdvantages: KeyAdvantages,
  ResearchToolRecover: ResearchToolRecover,
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

  const [shouldRecover, setShouldRecover] = useState(false);
  const [recoverTaskId, setRecoverTaskId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('taskId');
    const taskStatus = urlParams.get('status');

    if (taskId && taskStatus !== 'finished') {
      setShouldRecover(true);
      setRecoverTaskId(taskId);
    } else {
      // Check for recent unfinished tasks
      (async () => {
        try {
          const token = localStorage.getItem('alternativelyAccessToken');
          if (!token) {
            setShouldRecover(false);
            setRecoverTaskId(null);
            return;
          }
          const res = await apiClient.getAlternativeWebsiteList(1, 1);
          const latestTask = res?.data?.[0] || res?.list?.[0];
          if (latestTask && latestTask.generatorStatus === 'processing') {
            setPendingTask(latestTask);
            setShowConfirmModal(true);
          } else {
            setShouldRecover(false);
            setRecoverTaskId(null);
          }
        } catch (e) {
          setShouldRecover(false);
          setRecoverTaskId(null);
        }
      })();
    }
  }, []);

  const handleConfirmRecover = () => {
    setShouldRecover(true);
    setRecoverTaskId(pendingTask.websiteId);
    setShowConfirmModal(false);
    setPendingTask(null);
  };

  const handleCancelRecover = () => {
    setShouldRecover(false);
    setRecoverTaskId(null);
    setShowConfirmModal(false);
    setPendingTask(null);
  };

  if (!article) {
    return null;
  }

  const sections = article?.sections || [];
  const author = article?.author || 'default';

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
                {shouldRecover ? (
                  <ResearchToolRecover websiteId={recoverTaskId} />
                ) : (
                  <ResearchTool/>
                )}
              </div>
            );
          }

          const Component = COMPONENT_MAP[section.componentName];
          if (!Component) return null;

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
      <BottomBanner onClick={handleBottomBannerClick} />
      
      <Modal
        title="Resume Unfinished Task"
        open={showConfirmModal}
        onOk={handleConfirmRecover}
        onCancel={handleCancelRecover}
        okText="Resume Task"
        cancelText="Cancel"
      >
        <p>We found an unfinished task from your recent session. Would you like to resume it?</p>
      </Modal>
    </div>
  );
};

export default memo(CommonLayout);