'use client';
import React from 'react';

// Define the feature list data with enhanced descriptions
const features = [
  {
    title: "Intelligent Competitor Analysis",
    description: "Automatically identify your most impactful competitors based on search volume and conversion potential, ensuring you target the right rivals."
  },
  {
    title: "AI-Powered Content Generation",
    description: "Generate objective, data-driven comparison content that authentically highlights your unique strengths and builds visitor trust."
  },
  {
    title: "Advanced SEO Optimization",
    description: "Utilize built-in tools to optimize titles, URLs, headings, and content for maximum search engine visibility and organic traffic growth."
  },
  {
    title: "Dynamic Comparison Tables",
    description: "Create visually appealing, responsive comparison tables that clearly showcase your advantages and simplify the decision-making process for prospects."
  },
  {
    title: "Integrated Conversion Optimization",
    description: "Leverage built-in A/B testing and conversion rate optimization features to continuously enhance page performance and maximize your ROI."
  },
  {
    title: "Automated Content Updates",
    description: "Keep your comparison data current and accurate with automatic competitor monitoring and content refreshes, saving you valuable time."
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
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          How AltPage.ai Builds High-Converting Alternative Pages
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-16 max-w-3xl mx-auto">
          SEO oriented and perfect page structure without the hassle.
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