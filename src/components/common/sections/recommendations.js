'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const HelpfulResources = ({ data, theme = 'normal' }) => {
  // Resource links for first column
  const resourcesColumnOne = [
    { title: "10 Best AI Image-to-Video Generators", url: "#" },
    { title: "Runway Image to Video", url: "#" },
    { title: "Kling AI Image to Video", url: "#" },
    { title: "How to Use Kling AI Image to Video", url: "#" },
    { title: "Kling AI Image to Video Not Working", url: "#" },
  ];
  
  // Resource links for second column
  const resourcesColumnTwo = [
    { title: "How to Use Runway Image to Video", url: "#" },
    { title: "How to Use Motion Brush", url: "#" },
    { title: "Kling AI Motion Brush", url: "#" },
    { title: "Runway Motion Brush", url: "#" },
    { title: "How to Use Kling AI Motion Brush", url: "#" },
  ];
  
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-grid.svg')] opacity-[0.05]"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-4 text-white">
          {data?.title || "Helpful Resources About Image to Video"}
        </h2>
        
        <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
          {data?.description || "Learn more about AI image to video generation with these articles."}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* First column of resources */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg shadow-purple-500/5">
            <ul className="space-y-4">
              {resourcesColumnOne.map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.url}
                    className="flex items-center text-left group hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-200">{resource.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Second column of resources */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg shadow-purple-500/5">
            <ul className="space-y-4">
              {resourcesColumnTwo.map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.url}
                    className="flex items-center text-left group hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-200">{resource.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* More resources link */}
        <a 
          href="#" 
          className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-medium transition-colors duration-200"
        >
          More Resources About Video Generation
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default HelpfulResources;