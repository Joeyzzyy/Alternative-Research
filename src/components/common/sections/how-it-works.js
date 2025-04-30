'use client';
import React from 'react';

// 定义新的步骤数据
const steps = [
  {
    step: 1,
    title: "AI finds your top rivals",
    description: "Our system analyzes search data to identify your most valuable competitor alternative opportunities."
  },
  {
    step: 2,
    title: "Generates data-backed comparisons",
    description: "Creates comprehensive, factual comparison pages highlighting your competitive advantages."
  },
  {
    step: 3,
    title: "Publishes SEO-perfect pages",
    description: "Deploys optimized pages to your site with the exact structure needed to rank for alternative searches."
  }
];

const AltPageFeatures = () => {
  // 滚动到顶部的函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // 平滑滚动
    });
  };

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations - 增强 */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute bottom-0 left-[-20%] right-[-20%] top-[20%] bg-[radial-gradient(circle_at_center,_rgba(167,139,250,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-[-20%] left-[0] right-[0] top-[-10%] bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1)_0%,_transparent_50%)]"></div>
      </div>
      {/* 原有的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee10_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa10_0%,_transparent_60%)]"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
        {/* Main Title and Intro */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text drop-shadow-[0_2px_4px_rgba(0,255,255,0.2)]">
          How AltPage.ai Works
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-16 max-w-3xl mx-auto">
          Our AI-powered system generates, optimizes, and maintains alternative pages that capture high-intent traffic from competitor searches.
        </p>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left mb-16">
          {steps.map((step) => (
            <div
              key={step.step}
              // 增强卡片样式和悬停效果
              className="bg-slate-800/60 p-6 rounded-lg border border-slate-700/50 shadow-lg shadow-cyan-500/15 hover:bg-slate-700/70 hover:border-cyan-400/80 hover:shadow-cyan-400/30 hover:scale-[1.03] transition-all duration-300 ease-in-out relative backdrop-blur-sm"
            >
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-500/30">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 pt-6">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Concluding Sentence */}
        <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto mb-8">
          Pages deployed in minutes, not weeks — with zero development work.
        </p>

        {/* "See It In Action" Button */}
        <button
          onClick={scrollToTop}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 ease-in-out"
        >
          See It In Action
        </button>
      </div>
    </div>
  );
};

export default AltPageFeatures;