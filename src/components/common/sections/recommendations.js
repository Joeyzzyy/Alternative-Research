'use client';
import React from 'react';

const HelpfulResources = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          The Best SEO Blogs We Recommend For You
        </h2>
        
        <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
          Expand your competitive analysis knowledge with these curated resources.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* First column */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg shadow-purple-500/5">
            <ul className="space-y-4">
              {[
                { title: "How to Write the Best SEO Blogs - A Complete Guide", url: "https://websitelm.com/blog/best-seo-blogs-writing-guide" },
                { title: "AI SEO Tools Scale Agile Solutions: Boost Your SEO with AI", url: "https://websitelm.com/blog/ai-seo-tools-agile-solutions" },
                { title: "B2B SaaS SEO in 2025: The Ultimate Guide to Dominate Search Rankings", url: "https://websitelm.com/blog/b2b-saas-seo-strategies-2025" },
                { title: "Is SEO DEAD in 2025? The Truth Behind the Myth", url: "https://websitelm.com/blog/seo-dead-2025-myths-truth" },
                { title: "How to Do an Enterprise SEO Audit: 7 Must-Check Areas for Success", url: "https://websitelm.com/blog/enterprise-seo-audit-guide" }
              ].map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-left group hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-200">
                      {resource.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Second column */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg shadow-purple-500/5">
            <ul className="space-y-4">
              {[
                { title: "5 Advanced Keyword Research Techniques for 2025", url: "https://websitelm.com/blog/advanced-keyword-research-techniques-2025" },
                { title: "Building Authority Backlinks: A Step-by-Step Guide for Beginners", url: "https://websitelm.com/blog/building-authority-backlinks-guide" },
                { title: "Advantages and Disadvantages of SEO: What You Need to Know", url: "https://websitelm.com/blog/advantages-disadvantages-seo-guide" },
                { title: "What is Local Search Intent and How to Optimize for It", url: "https://websitelm.com/blog/local-search-intent-optimization" },
                { title: "SaaS Technical SEO - The Complete Guide of 2025", url: "https://websitelm.com/blog/saas-technical-seo-guide-2025" }
              ].map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-left group hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-200">
                      {resource.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* More resources link */}
        <a 
          href="https://websitelm.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-medium transition-colors duration-200"
        >
          Know More About Our SEO Work Station
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default HelpfulResources;