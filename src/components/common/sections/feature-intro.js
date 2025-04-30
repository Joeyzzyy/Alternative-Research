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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Missing on 'Alternative' keywords? 
            <br />
            You're invisible.
          </h2>
          <p className="text-2xl font-medium text-slate-300 text-center mb-12 underline decoration-slate-500 underline-offset-4"> {/* Changed text-cyan-300 to text-slate-300 and decoration-cyan-500 to decoration-slate-500 */}
            Every day, potential customers search for alternatives to your competitors. Without optimized comparison pages, you're missing out on high-intent traffic.
          </p>

          {/* Step-by-step User Journey - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 text-left">

            {/* Step 1: The Search (Visual Above Text) */}
            <div className="flex flex-col items-center">
              {/* Visual Element First - Added consistent height */}
              <div className="w-full flex justify-center items-center mb-8 h-72"> {/* Set consistent height h-72 */}
                {/* --- Start: Simplified Google Search Bar --- */}
                {/* Updated border, shadow, and padding for a cleaner look */}
                {/* Added subtle UI elements to fill space */}
                <div className="w-full max-w-md bg-white rounded-lg border border-slate-300 shadow-xl transition-transform duration-300 p-6 sm:p-8 overflow-hidden text-sm font-sans flex flex-col justify-center h-full"> {/* Changed to flex-col */}

                  {/* Subtle Top Bar Simulation */}
                  <div className="flex items-center justify-between w-full mb-4 pb-2 border-b border-slate-200">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full opacity-70"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
                    </div>
                    <div className="w-1/3 h-2 bg-slate-200 rounded-sm opacity-70"></div> {/* Address bar placeholder */}
                  </div>

                  {/* Slightly refined inner search bar */}
                  <div className="flex items-center border border-gray-300 rounded-full px-4 py-2.5 shadow-sm bg-white w-full hover:shadow-md transition-shadow duration-200"> {/* Adjusted padding and added hover effect */}
                    <svg className="h-5 w-5 mr-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> {/* Adjusted icon size/color */}
                      <path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h5.21c-.23 1.65-1.68 2.86-3.58 2.86-2.18 0-3.95-1.78-3.95-3.98s1.77-3.98 3.95-3.98c1.2 0 2.1.5 2.78 1.13l1.9-1.83C16.84 5.88 14.76 4.73 12.18 4.73 8.36 4.73 5.03 7.94 5.03 12s3.33 7.27 7.15 7.27c3.98 0 6.83-2.8 6.83-6.97 0-.46-.04-.9-.12-1.33z"/>
                      <path fill="#34A853" d="M12.18 19.27c1.94 0 3.6-.83 4.8-2.18l-2.2-1.7c-.65.44-1.5.7-2.6.7-2.03 0-3.74-1.37-4.35-3.2H5.18v2.1C6.5 17.9 9.1 19.27 12.18 19.27z"/>
                      <path fill="#FBBC05" d="M7.83 14.39c-.18-.54-.28-1.1-.28-1.69s.1-1.15.28-1.69V8.9H5.18C4.8 9.8 4.6 10.88 4.6 12s.2 2.2.6 3.1l2.65-2.01z"/>
                      <path fill="#EA4335" d="M12.18 7.58c1.04 0 1.95.36 2.67 1.05l2.06-2.06C15.78 5.01 14.03 4.1 12.18 4.1c-3.08 0-5.7 1.37-7 3.7l2.65 2.01c.6-1.83 2.32-3.23 4.35-3.23z"/>
                      <path fill="none" d="M0 0h24v24H0z"/>
                    </svg>
                    {/* Input field */}
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-800 text-sm sm:text-base" readOnly />
                    {/* Optional Icons */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 ml-3 cursor-pointer hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v3a3 3 0 01-3 3z" />
                    </svg>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 ml-2 cursor-pointer hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                  </div>
                </div>
              </div>
              {/* Text Content Below */}
              <div className="w-full">
                {/* ... text content for step 1 ... */}
                <span className="inline-block px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-900/50 rounded-full mb-3">Step 1</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">User searches for alternatives
                </h3>
                <p className="text-gray-300 text-lg">
                High-intent prospects actively seeking options beyond your competitors
                </p>
              </div>
            </div>

            {/* Step 2: The Missed Opportunity (Visual Above Text) */}
            <div className="flex flex-col items-center">
              <div className="w-full flex justify-center items-center mb-8 h-72"> {/* Set consistent height h-72 */}
                <div className="w-full max-w-md bg-white rounded-lg border border-red-500/50 transition-transform duration-300 p-4 overflow-hidden text-sm font-sans relative h-full"> {/* Added h-full to fill parent */}
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 mb-3 bg-white opacity-70">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.03,16.06 5.03,12C5.03,7.94 8.36,4.73 12.19,4.73C14.76,4.73 16.84,5.88 18.13,7.56L20.47,5.22C18.46,3.31 15.6,2.18 12.19,2.18C6.92,2.18 2.73,6.59 2.73,12C2.73,17.41 6.92,21.82 12.19,21.82C17.8,21.82 21.61,17.88 21.61,12.33C21.61,11.89 21.51,11.5 21.35,11.1Z"/>
                    </svg>
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-600 text-xs" readOnly />
                  </div>
                  {/* Fake Results Area - Highlighted */}
                  <div className="space-y-3 opacity-80"> {/* Increased opacity slightly */}
                    {/* Result 1 - Boxed */}
                    <div className="border border-red-400 rounded p-2 bg-red-50/50"> {/* Added red border, padding, and light red background */}
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-a.com/</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Competitor A - The Easy Website Builder
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Build stunning websites quickly with Competitor A. Perfect for small businesses looking for a Wix alternative...
                      </p>
                    </div>
                    {/* Result 2 - Boxed */}
                    <div className="border border-red-400 rounded p-2 bg-red-50/50"> {/* Added red border, padding, and light red background */}
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-b.io/features</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Compare Competitor B vs Wix | Find Your Fit
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        See how Competitor B stacks up against Wix. More design freedom and better pricing options available...
                      </p>
                    </div>
                    {/* Result 3 - Boxed */}
                    <div className="hidden sm:block border border-red-400 rounded p-2 bg-red-50/50"> {/* Added red border, padding, and light red background */}
                      <span className="text-xs text-gray-600 block truncate">https://blog.competitor-c.dev/alternatives</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Top Wix Alternatives Reviewed for 2024
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Our experts review the leading alternatives to Wix, helping you choose the right platform...
                      </p>
                    </div>
                  </div>
                </div>
                {/* --- End: Simulated Search Results - Missed Opportunity --- */}
              </div>
              {/* Text Content Below */}
              <div className="w-full">
                 <span className="inline-block px-3 py-1 text-xs font-semibold text-red-400 bg-red-900/50 rounded-full mb-3">Step 2</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Competitor results dominate
                </h3>
                <p className="text-gray-300 text-lg">
                  Your competitors control the narrative and capture these valuable leads
                </p>
              </div>
            </div>

            {/* Step 3: The Solution (Visual Above Text) */}
            <div className="flex flex-col items-center">
            <div className="w-full flex justify-center items-center mb-8 h-72"> {/* Set consistent height h-72 */}
                <div className="w-full max-w-md bg-white rounded-lg border border-red-500/50 shadow-lg shadow-red-500/10 transition-transform duration-300 p-4 overflow-hidden text-sm font-sans relative h-full"> {/* Added h-full to fill parent */}
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 mb-3 shadow-sm bg-white opacity-70">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.03,16.06 5.03,12C5.03,7.94 8.36,4.73 12.19,4.73C14.76,4.73 16.84,5.88 18.13,7.56L20.47,5.22C18.46,3.31 15.6,2.18 12.19,2.18C6.92,2.18 2.73,6.59 2.73,12C2.73,17.41 6.92,21.82 12.19,21.82C17.8,21.82 21.61,17.88 21.61,12.33C21.61,11.89 21.51,11.5 21.35,11.1Z"/>
                    </svg>
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-600 text-xs" readOnly />
                  </div>
                  {/* Fake Results Area */}
                  <div className="space-y-3 opacity-40 blur-[2px]">
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
                    {/* Result 3 */}
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
                             <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-red-700 font-semibold text-base">You're Invisible Here!</p>
                          <p className="text-xs text-gray-700 mt-1">Competitors rank, but without an Alternative Page, you miss out.</p>
                      </div>
                  </div>
                </div>
                {/* --- End: Simulated Search Results - Missed Opportunity --- */}
              </div>
              <div className="w-full">
                {/* ... text content for step 3 ... */}
                <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-900/50 rounded-full mb-3">Step 3</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Your opportunity vanishes
                </h3>
                <p className="text-gray-300 text-lg">
                  Without targeted alternative pages, you miss these conversion-ready prospects
                </p>
              </div>
            </div>

          </div> {/* End of grid */}

          {/* Call to Action Section */}
          <div className="mt-16 text-center"> {/* Added margin-top for spacing */}
            <p className="text-xl font-medium text-slate-300 mb-6"> {/* Adjusted text size and margin-bottom */}
              Don't let competitors steal your potential customers.
            </p>
            {/* Enhanced Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-cyan-500/30"
            >
              Generate Alternative Pages Now
              {/* Arrow Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default AlternativePageFeature;