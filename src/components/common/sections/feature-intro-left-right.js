'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const CustomizableVideoUI = ({ data, theme = 'normal' }) => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-grid.svg')] opacity-[0.05]"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Video Generator UI */}
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-black rounded-lg overflow-hidden shadow-2xl shadow-slate-900/70 border border-slate-800/50">
              <div className="bg-slate-900 p-6 rounded-t-lg">
                <div className="bg-slate-800 rounded-lg p-10 flex flex-col items-center justify-center space-y-4 border border-slate-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Tap to upload image</p>
                </div>
                <p className="text-gray-500 text-xs mt-3">Upload JPG/PNG images up to 10MB, with a minimum width/height of 300px.</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Mode Selection */}
                <div>
                  <h3 className="text-gray-300 mb-3">Mode</h3>
                  
                  <div className="space-y-3">
                    {/* Standard Mode Option */}
                    <div className="flex items-center bg-slate-800/80 rounded-lg p-2 border-2 border-cyan-500">
                      <div className="w-24 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md mr-4 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-60 bg-cover bg-center" style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjAyODNiIi8+PC9zdmc+')"}}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-gray-200 text-sm font-medium">Standard Mode</h4>
                          <div className="h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Fast AI video generation speed</p>
                      </div>
                    </div>
                    
                    {/* Professional Mode Option */}
                    <div className="flex items-center bg-slate-800/80 rounded-lg p-2">
                      <div className="w-24 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md mr-4 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-60 bg-cover bg-center" style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjAyODNiIi8+PC9zdmc+')"}}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h4 className="text-gray-200 text-sm font-medium">Professional Mode</h4>
                            <span className="text-[10px] px-1.5 py-0.5 bg-rose-500 text-white rounded-sm">New</span>
                          </div>
                          <div className="h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Higher video quality but with longer generation time</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Prompt Strength */}
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-gray-300">Prompt Strength</h3>
                    <div className="ml-2 h-5 w-5 rounded-full border border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500">?</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-gray-400">30%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full relative">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full w-[30%]"></div>
                      <div className="absolute left-[30%] top-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-rose-500 shadow-lg"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>More Creative</span>
                    <span>Follow Prompt</span>
                  </div>
                </div>
                
                {/* Length */}
                <div>
                  <h3 className="text-gray-300 mb-3">Length</h3>
                  
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-200 text-sm">5s</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full border border-gray-600 flex items-center justify-center mr-2">
                      </div>
                      <span className="text-gray-200 text-sm">10s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Description */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/5 border border-slate-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white">
                {data?.title || "Freely Customizable Video Generation"}
              </h2>
            </div>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              {data?.description || "Our image to video AI generator allows you to enjoy utmost freedom. You can input your instructions, and set the options such as the end frame image, video length and aspect ratio, and Pollo AI will create however you desire."}
            </p>
            
            <button className="px-8 py-3.5 rounded-full relative overflow-hidden group">
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Turn Image to Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizableVideoUI;