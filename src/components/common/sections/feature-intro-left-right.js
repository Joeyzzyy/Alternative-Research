'use client';
import React from 'react';

// 定义功能列表数据
const features = [
  {
    title: "Competitor Analysis",
    description: "Automatically identify high-value competitors to target based on search volume and conversion potential."
  },
  {
    title: "AI-Powered Content",
    description: "Generate objective, fact-based comparison content that highlights your unique advantages."
  },
  {
    title: "SEO Optimization",
    description: "Built-in tools to optimize titles, URLs, headings and content for maximum search visibility."
  },
  {
    title: "Comparison Tables",
    description: "Create beautiful, responsive comparison tables that clearly show your advantages."
  },
  {
    title: "Conversion Optimization",
    description: "Integrated A/B testing and conversion rate optimization to maximize page performance."
  },
  {
    title: "Automatic Updates",
    description: "Keep your comparison data fresh with automatic competitor monitoring and content updates."
  }
];

const AltPageFeatures = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
        {/* Main Title and Intro */}
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          How AltPage.ai Creates Winning Alternative Pages
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-16 max-w-3xl mx-auto">
          Our platform makes it easy to create, optimize, and manage alternative pages that drive qualified traffic and conversions.
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 shadow-lg shadow-cyan-500/10 hover:bg-slate-700/60 hover:border-cyan-400/70 hover:scale-[1.02] transition-all duration-300 ease-in-out"
            >
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AltPageFeatures;