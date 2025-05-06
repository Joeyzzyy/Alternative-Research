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

  // State for search input animation
  const [animatedInputValue, setAnimatedInputValue] = useState('');
  const [animationPhase, setAnimationPhase] = useState('typing'); // 'typing', 'pausingAfterTyping', 'processing', 'resetting'
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false); // For icon click visual
  const [postClickPhase, setPostClickPhase] = useState('idle'); // 'idle', 'spinning', 'showingArrow'
  const fullTextToType = "wix alternative";

  // Effect to cycle through cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % competitorPages.length);
    }, 1000); // Change card every 1 second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect for search input animation and post-click sequence
  useEffect(() => {
    let timerId;
    let clickTimerId;
    let spinTimerId;
    let arrowTimerId;

    const typeCharacter = () => {
      if (currentCharIndex < fullTextToType.length) {
        setAnimatedInputValue(prev => prev + fullTextToType[currentCharIndex]);
        setCurrentCharIndex(prev => prev + 1);
      } else {
        setAnimationPhase('pausingAfterTyping');
      }
    };

    // No clearCharacter needed now, reset happens differently

    switch (animationPhase) {
      case 'typing':
        timerId = setTimeout(typeCharacter, currentCharIndex === 0 ? 700 : 120);
        break;

      case 'pausingAfterTyping':
        // Pause, then simulate click
        timerId = setTimeout(() => {
          setIsSearching(true); // Start click visual
          clickTimerId = setTimeout(() => {
            setIsSearching(false); // End click visual
            setAnimationPhase('processing'); // Move to the next phase
            setPostClickPhase('spinning'); // Start the spinning part of processing
          }, 400); // Click visual duration
        }, 1500); // Pause duration before click
        break;

      case 'processing':
        // This phase handles spinning and arrow
        if (postClickPhase === 'spinning') {
          // Duration of the spin animation
          spinTimerId = setTimeout(() => {
            setPostClickPhase('showingArrow');
          }, 1200); // Spin duration (adjust as needed)
        } else if (postClickPhase === 'showingArrow') {
          // Duration the arrow is shown
          arrowTimerId = setTimeout(() => {
            setAnimationPhase('resetting'); // Move to reset phase
          }, 1000); // Arrow display duration
        }
        break;

      case 'resetting':
        // Reset all relevant states to start the loop again
        setAnimatedInputValue('');
        setCurrentCharIndex(0);
        setPostClickPhase('idle');
        // No need to set isSearching false here, already done
        // Set short timeout before going back to typing for a smoother transition
        timerId = setTimeout(() => {
             setAnimationPhase('typing');
        }, 100); // Short delay before restart
        break;

      default:
        break;
    }

    return () => {
      clearTimeout(timerId);
      clearTimeout(clickTimerId);
      clearTimeout(spinTimerId);
      clearTimeout(arrowTimerId);
    };
    // Dependencies updated to include postClickPhase
  }, [animationPhase, postClickPhase, currentCharIndex, animatedInputValue, fullTextToType]);

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

        /* Add spinning animation */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 1.2s linear infinite; /* Adjust duration to match spinTimerId */
        }

        /* Styles for the spinner overlay */
        .spinner-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.85); /* Slightly transparent white background */
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          pointer-events: none;
        }
        .spinner-container.visible {
          opacity: 1;
          pointer-events: auto;
        }
        /* Simple spinner using border */
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #3b82f6; /* blue-500 */
          border-radius: 50%;
          width: 40px; /* Adjust size */
          height: 40px; /* Adjust size */
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Styles for the arrow overlay */
        .arrow-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.9); /* Optional: semi-transparent overlay */
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          pointer-events: none; /* Allow clicks through if needed */
        }
        .arrow-container.visible {
          opacity: 1;
          pointer-events: auto;
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
          <p className="text-lg text-gray-300 leading-relaxed mb-16 max-w-3xl mx-auto text-center">
            Every day, potential customers search for alternatives to your competitors. Without optimized comparison pages, you're missing out on high-intent traffic.
          </p>

          {/* Step-by-step User Journey - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 text-left">

            {/* Step 1: The Search (Visual Above Text) */}
            <div className="flex flex-col items-center">
              {/* Visual Element First - Added consistent height */}
              <div className="w-full flex justify-center items-center mb-8 h-72"> {/* Set consistent height h-72 */}
                {/* --- Start: Simplified Google Search Bar --- */}
                <div className="w-full max-w-md bg-white rounded-lg border border-slate-300 shadow-xl transition-all duration-300 p-6 sm:p-8 overflow-hidden text-sm font-sans flex flex-col justify-center h-full relative"> {/* Added relative positioning */}

                  {/* Content that fades during processing */}
                  <div className={`transition-opacity duration-300 ${postClickPhase === 'spinning' || postClickPhase === 'showingArrow' ? 'opacity-0' : 'opacity-100'}`}>
                     {/* Subtle Top Bar Simulation */}
                     <div className="flex items-center justify-between w-full mb-4 pb-2 border-b border-slate-200">
                       <div className="flex space-x-2">
                         <div className="w-3 h-3 bg-red-400 rounded-full opacity-70"></div>
                         <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
                         <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
                       </div>
                       <div className="w-1/3 h-2 bg-slate-200 rounded-sm opacity-70"></div> {/* Address bar placeholder */}
                     </div>

                     {/* Inner search bar - simplified */}
                     <div className="flex items-center border border-gray-300 rounded-full px-3 py-1.5 shadow-sm bg-white w-full hover:shadow-md transition-shadow duration-200">
                       {/* Google Logo Image */}
                       <img src="/images/google-logo.png" alt="Google logo" className="h-5 w-auto mr-3 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                       {/* Input field */}
                       <input type="text" value={animatedInputValue} className="flex-grow outline-none text-gray-800 text-sm sm:text-base mr-2 bg-transparent min-w-0" readOnly /> {/* Added min-w-0 */}
                       {/* Large Search Icon Button */}
                       <div
                         className={`ml-auto p-2 rounded-full transition-all duration-200 ease-in-out transform cursor-pointer flex items-center justify-center flex-shrink-0 ${ // Added ml-auto and flex-shrink-0
                           isSearching
                             ? 'bg-blue-700 scale-90 shadow-inner'
                             : 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg'
                         }`}
                         style={{ width: '36px', height: '36px' }} // Ensure size consistency
                       >
                         <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-5 w-5 text-white" // Icon size within the button
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                           strokeWidth={2.5} // Slightly thicker stroke
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                         </svg>
                       </div>
                     </div>
                  </div>

                   {/* Spinner Overlay */}
                   <div className={`spinner-container ${postClickPhase === 'spinning' ? 'visible' : ''}`}>
                     <div className="spinner"></div>
                   </div>

                   {/* Arrow Overlay */}
                   <div className={`arrow-container ${postClickPhase === 'showingArrow' ? 'visible' : ''}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
                <div className="w-full max-w-md bg-white rounded-lg border border-green-500/50 transition-transform duration-300 p-4 overflow-hidden text-sm font-sans relative h-full"> {/* Added h-full to fill parent */}
                  <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 mb-3 bg-white opacity-70">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.03,16.06 5.03,12C5.03,7.94 8.36,4.73 12.19,4.73C14.76,4.73 16.84,5.88 18.13,7.56L20.47,5.22C18.46,3.31 15.6,2.18 12.19,2.18C6.92,2.18 2.73,6.59 2.73,12C2.73,17.41 6.92,21.82 12.19,21.82C17.8,21.82 21.61,17.88 21.61,12.33C21.61,11.89 21.51,11.5 21.35,11.1Z"/>
                    </svg>
                    <input type="text" value="wix alternative" className="flex-grow outline-none text-gray-600 text-xs" readOnly />
                  </div>
                  {/* Fake Results Area - Highlighted */}
                  <div className="space-y-3 opacity-80"> {/* Increased opacity slightly */}
                    {/* Result 1 - Boxed */}
                    <div className="border border-green-400 rounded p-2 bg-green-50/50"> {/* Added green border, padding, and light green background */}
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-a.com/</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Competitor A - The Easy Website Builder
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        Build stunning websites quickly with Competitor A. Perfect for small businesses looking for a Wix alternative...
                      </p>
                    </div>
                    {/* Result 2 - Boxed */}
                    <div className="border border-green-400 rounded p-2 bg-green-50/50"> {/* Added green border, padding, and light green background */}
                      <span className="text-xs text-gray-600 block truncate">https://www.competitor-b.io/features</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-700 text-base sm:text-lg hover:underline block truncate font-medium">
                        Compare Competitor B vs Wix | Find Your Fit
                      </a>
                      <p className="text-gray-600 text-xs leading-tight mt-0.5">
                        See how Competitor B stacks up against Wix. More design freedom and better pricing options available...
                      </p>
                    </div>
                    {/* Result 3 - Boxed */}
                    <div className="hidden sm:block border border-green-400 rounded p-2 bg-green-50/50"> {/* Added green border, padding, and light green background */}
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
                 <span className="inline-block px-3 py-1 text-xs font-semibold text-green-400 bg-green-900/50 rounded-full mb-3">Step 2</span>
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