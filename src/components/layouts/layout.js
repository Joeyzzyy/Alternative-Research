'use client';
import React, { useEffect, useMemo, memo } from 'react';
import Header from './header-template';
import Footer from './footer-template';
/* divider */
import HeroSectionWithVideo from '../common/sections/hero-section-with-video';
import HeroSectionWithMultipleTexts from '../common/sections/hero-section-with-multiple-texts';
/* divider */
import TitleSection from '../common/sections/title-section';
import TitleSectionWithImage from '../common/sections/title-section-with-image';
/* divider */
import WhyChooseUsWithSmallBlocks from '../common/sections/why-choose-us-with-small-blocks';
import WhyChooseUsWithBlocks from '../common/sections/why-choose-us-with-blocks';
import WhyChooseUsWithStory from '../common/sections/why-choose-us-with-story';
/* divider */
import HowItWorksWithWorkflow from '../common/sections/how-it-works-with-workflow';
import HowItWorksWithBlocks from '../common/sections/how-it-works-with-blocks';
/* divider */
import FeaturesTabbed from '../common/sections/features-tabbed';
/* divider */
import ProductBenefitsWithBlocks from '../common/sections/product-benefits-with-blocks';
import ProductBenefitsWithTable from '../common/sections/product-benefits-with-table';
/* divider */
import UserReviewsWithMovingCards from '../common/sections/user-reviews-with-moving-cards';
/* divider */
import MeetOurTeam from '../common/sections/meet-our-team';
/* divider */
import JobListNormal from '../common/sections/job-list-normal';
/* divider */
import FAQ from '../common/sections/faq-standard';
/* divider */
import CallToAction from '../common/sections/call-to-action';
import CallToActionComplex from '../common/sections/call-to-action-complex';
import CallToActionWithInput from '../common/sections/call-to-action-with-input';
/* divider */
import KeyResultsWithTextBlock from '../common/sections/key-results-with-text-block';
import KeyResultsWithImage from '../common/sections/key-results-with-image';
import KeyResultsWithCards from '../common/sections/key-results-with-cards';
/* divider */
import PageListCard from '../common/sections/page-list-card';
/* divider */
import SubscriptionCard from '../common/sections/subscription-card';
/* divider */
import FeatureComparisonTable from '../common/sections/feature-comparison-table';
import ResearchTool from '../common/sections/research-tool';

const COMPONENT_MAP = {
  TitleSection: TitleSection,
  TitleSectionWithImage: TitleSectionWithImage,
  HeroSectionWithVideo: HeroSectionWithVideo,
  HeroSectionWithMultipleTexts: HeroSectionWithMultipleTexts,
  WhyChooseUsWithSmallBlocks: WhyChooseUsWithSmallBlocks,
  WhyChooseUsWithBlocks: WhyChooseUsWithBlocks,
  WhyChooseUsWithStory: WhyChooseUsWithStory,
  HowItWorksWithWorkflow: HowItWorksWithWorkflow,
  FeaturesTabbed: FeaturesTabbed,
  ProductBenefitsWithBlocks: ProductBenefitsWithBlocks,
  UserReviewsWithMovingCards: UserReviewsWithMovingCards,
  MeetOurTeam: MeetOurTeam,
  JobList: JobListNormal,
  Faqs: FAQ,
  CallToActionComplex: CallToActionComplex,
  CallToActionWithEmailInput: CallToActionWithInput,
  ProductBenefitsWithTable: ProductBenefitsWithTable,
  KeyResultsWithTextBlock: KeyResultsWithTextBlock,
  KeyResultsWithImage: KeyResultsWithImage,
  KeyResultsWithCards: KeyResultsWithCards,
  HowItWorksWithBlocks: HowItWorksWithBlocks,
  CallToAction: CallToAction,
  PageListCard: PageListCard,
  SubscriptionCard: SubscriptionCard,
  FeatureComparisonTable: FeatureComparisonTable,
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
          memo={() => JSON.stringify(headerData)}
        />
      )}
      
      <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {sections.map((section, index) => {
          const Component = COMPONENT_MAP[section.componentName];
          if (!Component) return null;
          
          return (
            <div 
              key={`${section.componentName}-${section.sectionId}`}
              className="w-full bg-white"
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
          memo={() => JSON.stringify(footerData)}
        />
      )}
    </div>
  );
};

export default memo(CommonLayout);