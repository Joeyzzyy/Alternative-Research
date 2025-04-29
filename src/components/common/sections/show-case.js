'use client';
import React, { useState, useEffect, forwardRef } from 'react';
import { Tabs } from 'antd';
import { LineChartOutlined, ShoppingCartOutlined, AimOutlined } from '@ant-design/icons';

const CustomizableResearchUI = forwardRef(({ initialActiveKey = 'ranking', targetKey }, ref) => {
  const [activeTabKey, setActiveTabKey] = useState(initialActiveKey || 'ranking');
  const validTabKeys = ['ranking', 'conversion', 'sem'];
  const getValidKey = (key) => validTabKeys.includes(key) ? key : 'ranking';

  useEffect(() => {
    setActiveTabKey(getValidKey(initialActiveKey));
  }, [initialActiveKey]);

  useEffect(() => {
    if (targetKey && targetKey !== activeTabKey) {
      setActiveTabKey(targetKey);
    }
  }, [targetKey]);

  const items = [
    {
      key: 'ranking',
      label: 'Case Study: SEO Ranking',
      children: (
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="py-12 space-y-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                <LineChartOutlined />
              </div>
              <h3 className="text-2xl font-bold text-white">Ranking Improvement Case</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Breaking Through SEO Plateaus
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              A tech company struggled with slow organic growth despite SEO efforts. By deploying AI-generated alternative pages targeting specific competitor weaknesses, they achieved significant ranking improvements for high-value keywords within weeks, capturing previously inaccessible organic traffic.
            </p>
            
            <div className="flex items-center space-x-2 text-cyan-400 mb-8">
              <span className="font-medium">Key Results:</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm">+45% Organic Traffic</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm">Page 1 Ranking for Target Keywords</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <div className="aspect-w-16 aspect-h-9 w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 bg-slate-800 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center space-x-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              <div className="flex-grow bg-slate-700 rounded p-3 space-y-2">
                <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                <div className="h-3 bg-slate-600/80 rounded w-full"></div>
                <div className="h-3 bg-slate-600/80 rounded w-5/6"></div>
                <div className="h-3 bg-slate-600/80 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'conversion',
      label: 'Case Study: Conversion Lift',
      children: (
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="flex justify-center order-2 md:order-1">
            <div className="aspect-w-16 aspect-h-9 w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 bg-slate-800 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center space-x-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              <div className="flex-grow bg-slate-700 rounded p-3 space-y-2">
                <div className="h-4 bg-purple-500/30 rounded w-1/2"></div>
                <div className="h-3 bg-slate-600/80 rounded w-full"></div>
                <div className="h-3 bg-slate-600/80 rounded w-full"></div>
                <div className="h-3 bg-slate-600/80 rounded w-3/4"></div>
              </div>
            </div>
          </div>
          
          <div className="py-12 space-y-8 order-1 md:order-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl">
                <ShoppingCartOutlined />
              </div>
              <h3 className="text-2xl font-bold text-white">Conversion Optimization Case</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Turning Clicks into Customers
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              An e-commerce startup faced challenges converting visitors from comparison searches. Alternative pages highlighting their unique selling points and addressing specific user intents led to a measurable increase in conversion rates, particularly for high-intent traffic segments.
            </p>
            
            <div className="flex items-center space-x-2 text-purple-400 mb-8">
              <span className="font-medium">Key Results:</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">+25% Registration Conversion</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">Improved Ranking for Niche Keywords</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'sem',
      label: 'Case Study: SEM Landing Pages',
      children: (
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="py-12 space-y-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-amber-500 to-rose-500 rounded-lg flex items-center justify-center text-white text-xl">
                <AimOutlined />
              </div>
              <h3 className="text-2xl font-bold text-white">High-ROI SEM Case</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Maximizing Paid Ad Spend
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              A marketing agency sought better ROI from SEM campaigns. By using AI-generated alternative pages as highly targeted landing destinations, they significantly improved lead quality and conversion rates from paid traffic, leading to a better return on ad spend compared to generic landing pages.
            </p>
            
            <div className="flex items-center space-x-2 text-amber-400 mb-8">
              <span className="font-medium">Key Results:</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm">+15% Lead Conversion Rate</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm">Ranked for 8 High-Intent Keywords</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <div className="aspect-w-16 aspect-h-9 w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 bg-slate-800 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center space-x-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              <div className="flex-grow bg-slate-700 rounded p-3 space-y-2">
                <div className="h-4 bg-amber-500/30 rounded w-1/3"></div>
                <div className="h-3 bg-slate-600/80 rounded w-full"></div>
                <div className="h-3 bg-slate-600/80 rounded w-4/5"></div>
                <div className="h-3 bg-slate-600/80 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div id="showcase-section" ref={ref} className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Our Customers See Real Results
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Here's what our customers are saying about their alternative page strategy.
          </p>
        </div>

        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={items}
          centered
          className="showcase-tabs"
        />
      </div>

      <style jsx global>{`
        .showcase-tabs .ant-tabs-nav {
          margin-bottom: 40px !important;
        }
        .showcase-tabs .ant-tabs-tab {
          padding: 12px 20px !important;
          font-size: 1rem !important;
          color: #94a3b8 !important;
        }
        .showcase-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #67e8f9 !important;
          font-weight: 600 !important;
        }
        .showcase-tabs .ant-tabs-ink-bar {
          background: linear-gradient(to right, #22d3ee, #a78bfa) !important;
          height: 3px !important;
        }
        .showcase-tabs .ant-tabs-tab:hover {
          color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
});

CustomizableResearchUI.displayName = 'CustomizableResearchUI';

export default CustomizableResearchUI;