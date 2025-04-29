'use client';
import React, { useState, useEffect } from 'react';
// Import icons if you plan to use them, e.g., from react-icons
// import { FiSearch, FiXCircle, FiTarget, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

// Define page data outside the component or inside if needed
const competitorPages = [
  { id: 1, competitor: 'Competitor A', focus: 'Showcasing superior ease-of-use vs A...' },
  { id: 2, competitor: 'Competitor B', focus: 'Focusing on pricing advantage over B...' },
  { id: 3, competitor: 'Competitor C', focus: 'Highlighting unique features compared to C...' },
  { id: 4, competitor: 'Competitor D', focus: 'Emphasizing better customer support than D...' },
  { id: 5, competitor: 'Competitor E', focus: 'Comparing integration capabilities with E...' },
];

const AlternativePageFeature = () => {
  const [activeIndex, setActiveIndex] = useState(0); // State for active card index

  // Effect to cycle through cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % competitorPages.length);
    }, 1000); // Change card every 0.5 seconds (was 3000)

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to determine the CSS class based on index relative to activeIndex
  const getCardClass = (index) => {
    const diff = index - activeIndex;
    const total = competitorPages.length;

    // Normalize difference for wrapping around
    let position;
    if (diff === 0) {
      position = 'active'; // Current card
    } else if (diff === 1 || diff === -(total - 1)) {
      position = 'next'; // Card immediately after
    } else if (diff === 2 || diff === -(total - 2)) {
      position = 'upcoming'; // Card after the next one
    } else if (diff === -1 || diff === total - 1) {
      position = 'prev'; // Card immediately before
    } else {
      position = 'hidden'; // Other cards
    }
    // console.log(`Index: ${index}, Active: ${activeIndex}, Diff: ${diff}, Position: ${position}`); // For debugging
    return `page-card page-card-${position}`;
  };

  return (
    <>
      {/* Add CSS Keyframes for the animation */}
      <style jsx>{`
        .animate-page-1 {
          animation: pageAppear 0.6s ease-out 0.2s forwards;
          opacity: 0; /* Start hidden */
        }
        .animate-page-2 {
          animation: pageAppear 0.6s ease-out 0.4s forwards;
          opacity: 0; /* Start hidden */
        }
        .animate-page-3 {
          animation: pageAppear 0.6s ease-out 0.6s forwards;
          opacity: 0; /* Start hidden */
        }

        @keyframes pageAppear {
          0% {
            opacity: 0;
            transform: translateY(20px) rotate(0deg) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(var(--final-rotate)) scale(1);
          }
        }

        /* Define final rotation for each card using CSS variables */
        .page-1-rotate { --final-rotate: 1deg; }
        .page-2-rotate { --final-rotate: -3deg; }
        .page-3-rotate { --final-rotate: 6deg; }

        /* Apply slight translation adjustments if needed, can be combined with rotate */
        .page-2-pos { transform: translateX(-4px) translateY(-4px); } /* Corresponds to -translate-x-1 -translate-y-1 */
        .page-3-pos { transform: translateX(8px) translateY(4px); } /* Corresponds to translate-x-2 translate-y-1 */

        /* Combine animation and final position/rotation */
        .page-card-1 {
          --final-rotate: 1deg;
          animation: pageAppear 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
         .page-card-2 {
          --final-rotate: -3deg;
          animation: pageAppear 0.6s ease-out 0.4s forwards;
          opacity: 0;
          /* Apply final translation after animation if needed, or bake into keyframe */
          
          /* transform: translateX(-4px) translateY(-4px); /* Example */
        }
         .page-card-3 {
          --final-rotate: 6deg;
          animation: pageAppear 0.6s ease-out 0.6s forwards;
          opacity: 0;
           /* Apply final translation after animation if needed, or bake into keyframe */
          /* transform: translateX(8px) translateY(4px); /* Example */
        }

        /* Simplified Keyframe incorporating final transform */
         @keyframes pageAppearCombined1 {
          0% { opacity: 0; transform: translateY(20px) rotate(0deg) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) rotate(1deg) scale(1); }
        }
         @keyframes pageAppearCombined2 {
          0% { opacity: 0; transform: translateY(20px) rotate(0deg) scale(0.95); }
          100% { opacity: 1; transform: translateY(-4px) translateX(-4px) rotate(-3deg) scale(1); }
        }
         @keyframes pageAppearCombined3 {
          0% { opacity: 0; transform: translateY(20px) rotate(0deg) scale(0.95); }
          100% { opacity: 1; transform: translateY(4px) translateX(8px) rotate(6deg) scale(1); }
        }

        .animate-page-combined-1 { animation: pageAppearCombined1 0.6s ease-out 0.2s forwards; opacity: 0; }
        .animate-page-combined-2 { animation: pageAppearCombined2 0.6s ease-out 0.4s forwards; opacity: 0; }
        .animate-page-combined-3 { animation: pageAppearCombined3 0.6s ease-out 0.6s forwards; opacity: 0; }

        .page-card {
          position: absolute;
          inset: 0;
          border-radius: 0.375rem; /* rounded-md */
          padding: 0.75rem; /* p-3 */
          font-size: 0.75rem; /* text-xs */
          overflow: hidden;
          transition: transform 0.4s ease-in-out, opacity 0.4s ease-in-out, z-index 0s linear 0.2s; /* Faster transition, adjusted delay */
          backface-visibility: hidden; /* Improve animation performance */
          transform-style: preserve-3d; /* Improve animation performance */
          /* Add a subtle background pattern or texture if desired */
          /* background-image: linear-gradient(45deg, #f9fafb 25%, transparent 25%), linear-gradient(-45deg, #f9fafb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f9fafb 75%), linear-gradient(-45deg, transparent 75%, #f9fafb 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px; */
        }

        .page-card-active {
          opacity: 1;
          transform: translateX(0) translateY(0) rotate(0deg) scale(1);
          z-index: 10;
          background-color: white;
          border: 1px solid #64748b; /* border-slate-500 */
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* shadow-xl */
          color: #1e293b; /* text-slate-800 */
        }

        .page-card-next {
          opacity: 0.7; /* Slightly less opaque */
          transform: translateX(12%) translateY(4%) rotate(3deg) scale(0.92); /* Adjusted transform */
          z-index: 9;
          background-color: rgba(255, 255, 255, 0.85); /* Slightly less transparent */
          border: 1px solid #94a3b8; /* border-slate-400 */
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* shadow-lg */
          color: #334155; /* text-slate-700 */
        }

         .page-card-upcoming {
           opacity: 0.4; /* Less opaque */
           transform: translateX(24%) translateY(8%) rotate(6deg) scale(0.84); /* Adjusted transform */
           z-index: 8;
           background-color: rgba(255, 255, 255, 0.7); /* Less transparent */
           border: 1px solid #cbd5e1; /* border-slate-300 */
           box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); /* shadow-md */
           color: #475569; /* text-slate-600 */
         }

        .page-card-prev {
          opacity: 0; /* Hide previous card quickly */
          transform: translateX(-24%) translateY(0) rotate(-6deg) scale(0.84); /* Adjusted transform */
          z-index: 7;
           background-color: rgba(255, 255, 255, 0.7);
           border: 1px solid #cbd5e1;
           color: #475569;
        }

        .page-card-hidden {
          opacity: 0;
          transform: translateY(15%) scale(0.75); /* Adjusted transform */
          z-index: 1;
           background-color: rgba(255, 255, 255, 0.7);
           border: 1px solid #cbd5e1;
           color: #475569;
        }

        /* Skeleton styles */
        .skeleton {
          background-color: #e2e8f0; /* bg-slate-200 */
          border-radius: 0.25rem; /* rounded */
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        /* Ensure title is readable on non-active cards */
        .page-card:not(.page-card-active) .card-title {
           color: inherit; /* Inherit color from parent card state */
           opacity: 0.9; /* Slightly reduce opacity if needed */
        }

      `}</style>

      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-black py-24 sm:py-32 relative overflow-hidden">
        {/* Enhanced AI-style background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee20_0%,_transparent_50%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa25_0%,_transparent_55%)] opacity-70"></div>
        {/* Optional: Add more subtle background elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-2000"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            What is an Alternative Page?
          </h2>
          <p className="text-2xl font-medium text-slate-300 text-center mb-12 underline decoration-slate-500 underline-offset-4"> {/* Changed text-cyan-300 to text-slate-300 and decoration-cyan-500 to decoration-slate-500 */}
            Let's follow a user's Google search journey to see exactly what an Alternative Page is and why it's crucial for you! ✨
          </p>

          {/* Step-by-step User Journey */}
          <div className="space-y-16">

            {/* Step 1: The Search */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-left">
              <div className="md:w-1/2 flex justify-center items-center">
                {/* --- Start: Simulated Google Search Results --- */}
                <div className="w-full h-64 bg-white rounded-lg border border-slate-700 shadow-lg shadow-cyan-500/10 transform rotate-[-2deg] transition-transform duration-300 hover:rotate-[-1deg] p-4 overflow-hidden text-sm font-sans">
                  {/* Search Bar Area */}
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 mb-3 shadow-sm bg-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-800 text-xs sm:text-sm" readOnly />
                    {/* Optional: Add fake mic/camera icons if needed */}
                  </div>

                  {/* Fake Results Area */}
                  <div className="space-y-3">
                    {/* Result 1 */}
                    <div>
                      <span className="text-xs text-gray-600 block truncate">https://www.example-competitor.com/alternatives</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Your Best Wix Alternative, EZsite!
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Tired of Wix limitations? Discover EZsite, the intuitive and powerful website builder designed for growth. See why we're the top choice...
                      </p>
                    </div>
                    {/* Result 2 */}
                    <div>
                      <span className="text-xs text-gray-600 block truncate">https://www.another-site.io/blog/wix-vs-others</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Looking For Wix Alternative? Try Lovable
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Explore Lovable, the flexible platform loved by creators. If Wix isn't cutting it, find out if Lovable is the perfect fit for your project...
                      </p>
                    </div>
                     {/* Result 3 (Optional) */}
                     <div className="hidden sm:block"> {/* Hide on very small screens */}
                      <span className="text-xs text-gray-600 block truncate">https://www.yetanotherplatform.dev/wix-alternative</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        The Ultimate Wix Alternative Guide for 2024
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Comprehensive review of website builders that serve as great alternatives to Wix, focusing on flexibility and developer tools...
                      </p>
                    </div>
                  </div>
                </div>
                {/* --- End: Simulated Google Search Results --- */}
              </div>
              <div className="md:w-1/2">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-900/50 rounded-full mb-3">Step 1</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">The Search Begins</h3>
                <p className="text-gray-300 text-lg">
                  Let's say users are just starting their website journey. They might not know about options beyond well-known tools like Wix. So, they might search for something like <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-300 text-base">wix alternative</code>.
                </p>
              </div>
            </div>

            {/* Step 2: The Missed Opportunity */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 text-left">
              <div className="md:w-1/2 flex justify-center items-center">
                {/* --- Start: Simulated Search Results - Missed Opportunity --- */}
                <div className="w-full h-64 bg-white rounded-lg border border-slate-700 shadow-lg shadow-red-500/10 transform rotate-[2deg] transition-transform duration-300 hover:rotate-[1deg] p-4 overflow-hidden text-sm font-sans relative">
                  {/* Search Bar Area (same as step 1) */}
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 mb-3 shadow-sm bg-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-800 text-xs sm:text-sm" readOnly />
                  </div>

                  {/* Fake Results Area (generic competitors, user's site is missing) */}
                  <div className="space-y-3 opacity-40 blur-[2px]"> {/* Make results less prominent */}
                    {/* Result 1 */}
                    <div>
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-a.com/</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Competitor A - The Easy Website Builder
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Build stunning websites quickly with Competitor A. Perfect for small businesses looking for a Wix alternative...
                      </p>
                    </div>
                    {/* Result 2 */}
                    <div>
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-b.io/features</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Compare Competitor B vs Wix | Find Your Fit
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        See how Competitor B stacks up against Wix. More design freedom and better pricing options available...
                      </p>
                    </div>
                    {/* Result 3 (Optional) */}
                    <div className="hidden sm:block">
                      <span className="text-xs text-gray-600 block truncate">https://blog.competitor-c.dev/alternatives</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Top Wix Alternatives Reviewed for 2024
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Our experts review the leading alternatives to Wix, helping you choose the right platform...
                      </p>
                    </div>
                  </div>

                  {/* Missed Opportunity Overlay Message */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-red-900/20 to-transparent flex items-center justify-center p-4">
                      <div className="text-center p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-red-300 max-w-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* Info circle */}
                             <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" transform="rotate(180 12 12) scale(0.6)" /> {/* Sad face inside */}
                          </svg>
                          <p className="text-red-700 font-semibold text-base">You're Invisible Here!</p>
                          <p className="text-xs text-gray-700 mt-1">Without an Alternative Page, you miss out on these high-intent searches.</p>
                      </div>
                  </div>
                </div>
                {/* --- End: Simulated Search Results - Missed Opportunity --- */}
              </div>
              <div className="md:w-1/2">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-red-400 bg-red-900/50 rounded-full mb-3">Step 2</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">The Void</h3>
                <p className="text-gray-300 text-lg">
                  Without a dedicated "Alternative Page" targeting that competitor keyword, you're invisible. You lose the chance to capture this high-intent traffic looking for exactly what you offer.
                </p>
              </div>
            </div>

            {/* Step 3: The Solution */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-left">
              <div className="md:w-1/2 flex justify-center items-center">
                {/* --- Start: Animated Page Carousel --- */}
                <div className="w-full h-64 bg-gradient-to-br from-slate-800/60 via-slate-900/50 to-slate-800/60 rounded-lg border border-slate-700 shadow-lg shadow-purple-500/10 p-6 relative overflow-hidden flex items-center justify-center perspective">
                  {/* Stacked Pages Simulation Container */}
                  <div className="relative w-full h-full"> {/* Use full container size */}
                    {/* Map over the pages and apply dynamic classes */}
                    {competitorPages.map((page, index) => (
                      <div key={page.id} className={`${getCardClass(index)} p-3 flex flex-col space-y-2`}>
                        {/* Real Title */}
                        <p className="font-semibold text-sm mb-1 card-title truncate"> {/* Added card-title class */}
                          Alternative to {page.competitor}
                        </p>

                        {/* Skeleton Content */}
                        {/* Subtitle Placeholder */}
                        <div className="skeleton h-3 w-full"></div>
                        <div className="skeleton h-3 w-2/3"></div>
                        {/* Feature List Placeholder */}
                        <div className="flex-grow space-y-1.5 pt-2">
                          <div className="flex items-center space-x-1.5">
                            <div className="skeleton w-3 h-3 rounded-full"></div>
                            <div className="skeleton h-2.5 w-3/4"></div>
                          </div>
                           <div className="flex items-center space-x-1.5">
                            <div className="skeleton w-3 h-3 rounded-full"></div>
                            <div className="skeleton h-2.5 w-1/2"></div>
                          </div>
                           <div className="flex items-center space-x-1.5">
                            <div className="skeleton w-3 h-3 rounded-full"></div>
                            <div className="skeleton h-2.5 w-5/6"></div>
                          </div>
                           <div className="flex items-center space-x-1.5"> {/* Added one more skeleton line */}
                            <div className="skeleton w-3 h-3 rounded-full"></div>
                            <div className="skeleton h-2.5 w-1/3"></div>
                          </div>
                        </div>
                        {/* Button Placeholder */}
                        <div className="skeleton h-6 w-1/2 self-start rounded-md"></div>
                      </div>
                    ))}
                  </div>

                   {/* Optimization Icon (optional) */}
                   <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 h-6 w-6 text-purple-400/70 animate-spin animation-delay-1000 z-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527c.47-.336 1.06-.336 1.53 0l.774.55c.47.336.696.916.55 1.442l-.15.9c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774.55c-.47-.336-.696.916-.55 1.442l.15.9c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737.527c.47-.336 1.06-.336 1.53 0l.774.55c.47.336.696.916.55 1.442l-.15.9c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774.55c-.47-.336-.696.916-.55 1.442l.15.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.07-.424.384.764.78-.93.398-.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.07-.424.384.764.78-.93.398-.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205-.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.07-.424.384.764.78-.93.398-.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.07-.424.384.764.78-.93.398-.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205-.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9c.09.542.56.94 1.11.94h1.093c.55 0 1.02-.398 1.11.94l.149-.894c.07-.424.384-.764.78-.93.398.164.855.142 1.205-.108l.737.527c.47-.336 1.06.336 1.53 0l.774-.55c.47-.336.696.916.55-1.442l-.15-.9c-.09-.542-.56-.94-1.11-.94h-1.093c-.55 0-1.02.398-1.11.94l-.149.894c-.07.424-.384.764-.78.93-.398.164-.855.142-1.205-.108l-.737-.527c-.47-.336-1.06-.336-1.53 0l-.774-.55c-.47-.336-.696.916-.55-1.442l.15-.9z" />
                   </svg>
                </div>
                {/* --- End: Animated Page Carousel --- */}
              </div>
              <div className="md:w-1/2">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-900/50 rounded-full mb-3">Step 3</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Strategy: Maximize Coverage</h3>
                <p className="text-gray-300 text-lg">
                  The core strategy is to create dedicated "Alternative Pages" targeting each of your relevant competitors. By building and optimizing these pages, you significantly increase your visibility when potential customers search for alternatives, capturing high-intent traffic you'd otherwise miss.
                </p>
              </div>
            </div>

            {/* Step 4: Gaining Visibility */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 text-left">
              <div className="md:w-1/2 flex justify-center items-center">
                {/* --- Start: Search Ranking Improvement Diagram --- */}
                <div className="w-full h-64 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-4 text-gray-400 text-sm font-sans shadow-lg shadow-green-500/10 transform rotate-[2deg] transition-transform duration-300 hover:rotate-[1deg] overflow-hidden">
                  {/* Diagram Title */}
                  <p className="font-semibold mb-3 text-center text-green-300">Search: "Competitor X Alternative"</p>

                  {/* Diagram Content Area */}
                  <div className="flex items-center justify-center space-x-4 h-40 w-full relative"> {/* Adjusted height and centering */}

                    {/* Initial State (Lower Rank) */}
                    <div className="flex flex-col items-center opacity-60">
                      <p className="text-xs mb-1 text-gray-500">Before</p>
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        {/* Your Page (Lower) */}
                        <div className="h-4 w-24 bg-green-800/80 rounded-sm border border-green-600/50 flex items-center justify-center text-[9px] text-green-200/80">Your Page</div>
                      </div>
                    </div>

                    {/* Arrow Indicating Progress */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400 self-center mx-1 sm:mx-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>

                    {/* Final State (Higher Rank) */}
                    <div className="flex flex-col items-center">
                       <p className="text-xs mb-1 text-white">After Optimization</p>
                       <div className="space-y-1.5">
                        {/* Your Page (Top) */}
                        <div className="h-4 w-24 bg-green-500 rounded-sm border-2 border-green-300 shadow-md shadow-green-500/30 flex items-center justify-center text-[9px] text-white font-bold">Your Page</div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                        <div className="h-4 w-24 bg-slate-600 rounded-sm"></div>
                      </div>
                    </div>

                  </div>
                   <p className="text-xs mt-3 text-center text-gray-500">Your page climbs the search rankings!</p>
                </div>
                {/* --- End: Search Ranking Improvement Diagram --- */}
              </div>
              <div className="md:w-1/2">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-green-400 bg-green-900/50 rounded-full mb-3">Step 4</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Climbing the Ranks</h3>
                <p className="text-gray-300 text-lg">
                  Optimized Alternative Pages rank highly in search results for competitor alternative keywords. Suddenly, users searching for options see *your* solution prominently displayed.
                </p>
              </div>
            </div>

            {/* Step 5: Conversion */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-left">
              <div className="md:w-1/2 flex justify-center items-center">
                {/* --- Start: User Click & Conversion Simulation --- */}
                <div className="w-full h-64 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-4 text-gray-400 text-sm font-sans shadow-lg shadow-yellow-500/10 transform rotate-[-2deg] transition-transform duration-300 hover:rotate-[-1deg] overflow-hidden relative">

                  {/* Simulated Search Result Snippet */}
                  <div className="bg-white/90 p-3 rounded-md shadow-md border border-slate-300 w-11/12 max-w-sm relative z-10 mb-4">
                    <span className="text-xs text-gray-600 block truncate">https://www.yoursite.com/alternative-to-competitor-x</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium text-yellow-600"> {/* Highlighted link */}
                      YourSite: The Best Alternative to Competitor X!
                    </a>
                    <p className="text-gray-600 text-xs leading-tight mt-0.5">
                      Discover why YourSite outperforms Competitor X. Better features, easier to use, and great pricing. Click here to learn more...
                    </p>
                  </div>

                  {/* Click Action & Success Indication */}
                  <div className="flex items-center justify-center space-x-3 mt-2 relative">
                     {/* Multiple Click Arrows */}
                     <div className="absolute -left-10 -top-2 flex flex-col space-y-1 opacity-80">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 transform rotate-[20deg] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" /> {/* Down arrow variant */}
                       </svg>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 transform rotate-[5deg] animate-pulse animation-delay-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" />
                       </svg>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 transform rotate-[-10deg] animate-pulse animation-delay-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" />
                       </svg>
                     </div>

                     {/* Success Text/Icon */}
                     <span className="text-lg font-semibold text-yellow-300 bg-yellow-900/60 px-3 py-1 rounded-md shadow z-10">
                       Click! <span className="text-xl ml-1">🎉</span> Traffic Acquired!
                     </span>
                  </div>
                   {/* Subtle background elements */}
                   <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/10 via-transparent to-transparent opacity-50 z-0"></div>

                </div>
                {/* --- End: User Click & Conversion Simulation --- */}
              </div>
              <div className="md:w-1/2">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-yellow-300 bg-yellow-900/50 rounded-full mb-3">Step 5</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Winning the Conversion</h3>
                <p className="text-gray-300 text-lg">
                  They click! Your Alternative Page clearly showcases your advantages over the competitor, addressing their needs directly and persuading them to choose you. This leads to higher conversions!
                </p>
              </div>
            </div>

          </div> {/* End of steps */}

        </div>
      </div>
    </>
  );
};

export default AlternativePageFeature;