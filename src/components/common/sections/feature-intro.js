'use client';
import React from 'react';
// Import an icon library if you want to add icons, e.g., react-icons
// import { FiArrowRightCircle, FiXCircle } from 'react-icons/fi';

const AlternativePageFeature = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-black py-24 sm:py-32 relative overflow-hidden">
      {/* Enhanced AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee20_0%,_transparent_50%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa25_0%,_transparent_55%)] opacity-70"></div>
      {/* Optional: Add more subtle background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          What is an Alternative Page?
        </h2>

        <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
          An alternative page strategically compares your product or service to popular competitors, capturing users actively looking for better options.
        </p>

        <div className="flex flex-col md:flex-row gap-8 mb-16 text-left text-gray-300">
          {/* "From This" Card with enhanced styling */}
          <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-500/20 hover:border-cyan-600/70">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              {/* Optional Icon: <FiXCircle className="text-red-500" /> */}
              From This:
            </h3>
            <p className="font-medium mb-2 text-cyan-400">Searching for options</p>
            {/* Refined mock Google search bar - closer to reality */}
            <div className="mb-4 px-4 py-2 bg-white rounded-full border border-gray-300 flex items-center text-sm shadow-sm hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-700">Competitor Name alternatives</span>
              {/* Optional: Add mock icons for mic/camera if desired at the end */}
            </div>
            {/* Mock Google Search Result Snippet - Generic */}
            <div className="p-4 bg-white rounded-lg shadow text-left">
              {/* Google-like URL color (adjusted for light bg) */}
              <span className="text-sm text-green-700 block mb-1">www.genericreviews.com › best-alternatives</span>
              {/* Google-like Title color and size (adjusted for light bg) */}
              <h4 className="text-lg text-blue-700 hover:underline cursor-pointer mb-1 font-medium">
                Top 10 Best [Competitor Name] Alternatives for 2024
              </h4>
              {/* Google-like Description color (adjusted for light bg) */}
              <p className="text-sm text-gray-700">
                Looking for options beyond [Competitor Name]? We reviewed dozens of tools. See our list of the top alternatives, pros, cons, and pricing... Often biased or outdated.
              </p>
            </div>
            {/* Edit 1: Add explanatory text below the search result */}
            <div className="flex items-center justify-center mt-2">
              <p className="text-xs text-gray-400 italic text-center">
                Low-quality comparison with no clear winner.
              </p>
              <div className="relative group ml-2">
                <span className="text-gray-400 cursor-pointer border border-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-slate-800/80 group-hover:bg-slate-700 transition" tabIndex={0}>?</span>
                <div className="absolute left-1/2 -translate-x-1/2 mb-2 bottom-full w-[350px] max-w-xs bg-gray-900 text-gray-100 text-xs rounded-lg shadow-lg p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition z-20 text-left whitespace-pre-line">
                  <strong>The Evolution: From Broad Info Pages to High-Converting Alternatives</strong>
                  <br /><br />
                  Content strategy isn't static; it evolves. We've moved beyond the era of simply casting a wide net. Today, success lies in precision – transitioning from general information to laser-focused Alternative Pages that capture users at the cusp of decision. This isn't just a minor tweak; it's a fundamental shift in how we convert interest into action.
                  <br /><br />
                  <strong>The Age of the Wide Net</strong>
                  <br />
                  Traditional content like guides aimed for broad awareness, attracting many early-stage researchers with low purchase intent. This resulted in modest direct conversions (typically 1–3%) and required significant nurturing.
                  <br /><br />
                  <strong>The Pivot to Precision Targeting ✨</strong>
                  <br />
                  The strategy evolved: Alternative Pages focus sharply on users actively searching for "[Competitor Name] alternatives" or "[Your Product] vs [Competitor]". This intercepts high-intent users precisely when they are comparing options and ready to be persuaded.
                  <br /><br />
                  <strong>The Payoff: Converting Intent into Action</strong>
                  <br />
                  Because these pages directly address the specific comparisons sought by qualified, decision-ready prospects, they convert at much higher rates (often 3–10%+). It's the powerful result of shifting from broad awareness to capturing high-intent moments.
                </div>
              </div>
            </div>
          </div>

          {/* "To This" Card with enhanced styling */}
          <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-purple-500/10 transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-600/70">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              {/* Optional Icon: <FiArrowRightCircle className="text-green-500" /> */}
              To This:
            </h3>
            <p className="font-medium mb-2 text-purple-400">Direct conversions</p>
            {/* Mock Google Search Result Snippet - Your Page */}
            <div className="mb-4 px-4 py-2 bg-white rounded-full border border-gray-300 flex items-center text-sm shadow-sm hover:shadow-md transition-shadow">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
               <span className="text-gray-700">Competitor Name alternatives</span>
             </div>
            <div className="p-4 bg-white rounded-lg shadow text-left">
               {/* Google-like URL color (adjusted for light bg) */}
               <span className="text-sm text-green-700 block mb-1">www.yourproduct.com › competitor-alternative</span>
               {/* Example search result title */}
               <h4 className="text-lg text-blue-700 hover:underline cursor-pointer mb-1 font-medium">
                 Best [Competitor Name] Alternative for [Specific Use Case/Year]
               </h4>
               {/* Example search result description */}
               <p className="text-sm text-gray-700">
                 [Your Product] is a top alternative to [Competitor Name]. See how we compare on features, pricing, and support. Get started free today...
               </p>
             </div>
             {/* Edit 2: Add explanatory text below the search result */}
             <div className="flex items-center justify-center mt-2">
               <p className="text-xs text-purple-300 italic font-medium text-center">
                 Clear comparison highlighting your advantages.
               </p>
               <div className="relative group ml-2">
                 <span className="text-purple-300 cursor-pointer border border-purple-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-slate-800/80 group-hover:bg-slate-700 transition" tabIndex={0}>?</span>
                 <div className="absolute left-1/2 -translate-x-1/2 mb-2 bottom-full w-[350px] max-w-xs bg-gray-900 text-purple-100 text-xs rounded-lg shadow-lg p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition z-20 text-left whitespace-pre-line">
                   <strong>The Evolution: From Broad Info Pages to High-Converting Alternatives</strong>
                   <br /><br />
                   Content strategy isn't static; it evolves. We've moved beyond the era of simply casting a wide net. Today, success lies in precision – transitioning from general information to laser-focused Alternative Pages that capture users at the cusp of decision. This isn't just a minor tweak; it's a fundamental shift in how we convert interest into action.
                   <br /><br />
                   <strong>The Age of the Wide Net</strong>
                   <br />
                   Traditional content like guides aimed for broad awareness, attracting many early-stage researchers with low purchase intent. This resulted in modest direct conversions (typically 1–3%) and required significant nurturing.
                   <br /><br />
                   <strong>The Pivot to Precision Targeting ✨</strong>
                   <br />
                   The strategy evolved: Alternative Pages focus sharply on users actively searching for "[Competitor Name] alternatives" or "[Your Product] vs [Competitor]". This intercepts high-intent users precisely when they are comparing options and ready to be persuaded.
                   <br /><br />
                   <strong>The Payoff: Converting Intent into Action</strong>
                   <br />
                   Because these pages directly address the specific comparisons sought by qualified, decision-ready prospects, they convert at much higher rates (often 3–10%+). It's the powerful result of shifting from broad awareness to capturing high-intent moments.
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativePageFeature;