'use client';
import React from 'react';

// 定义表格数据
const comparisonData = [
  { task: 'Competitor Analysis', manual: 'None', genericAI: 'Needs manual input', altPageAI: 'Auto-scouts rivals' },
  { task: 'SEO-Optimized Structure', manual: 'Error-prone', genericAI: 'Basic templates', altPageAI: 'Built-in SEO logic' },
  { task: 'Page Generation', manual: 'Slow', genericAI: 'Fast', altPageAI: 'Fast + Search-intent aligned' },
  { task: 'Content Uniqueness', manual: 'Repetitive', genericAI: 'Template-like', altPageAI: 'Tailored comparisons' },
  { task: 'Ongoing Updates', manual: 'Manual', genericAI: 'Needs republishing', altPageAI: 'Self-refreshing' },
  { task: 'Traffic Targeting', manual: 'General', genericAI: 'Brand-centric', altPageAI: 'Competitor keyword targeting' },
  { task: 'Conversion Focus', manual: 'Static', genericAI: 'Broad messaging', altPageAI: 'Benefit-driven by persona' },
];

// 定义结论数据
const conclusionData = {
  manual: 'High effort, slow impact',
  genericAI: 'Fast but shallow',
  altPageAI: 'Purpose-built for SEO growth',
};

const CompareTable = () => {
  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black py-20 sm:py-28 relative overflow-hidden">
      {/* 背景装饰元素 (类似 feature-intro) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#a78bfa15_0%,_transparent_40%)] opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#22d3ee1a_0%,_transparent_45%)] opacity-60"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full filter blur-3xl opacity-30 animate-pulse animation-delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white">
            <span className="text-cyan-400">Automation</span> vs. <span className="text-slate-400">Manual</span> Process
          </h2>
          <p className="text-xl sm:text-2xl font-medium text-slate-300 max-w-3xl mx-auto">
            See how AltPage.ai transforms weeks of work into minutes.
          </p>
        </div>

        {/* 表格容器，允许在小屏幕上水平滚动 */}
        <div className="overflow-x-auto rounded-lg shadow-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-slate-700 text-sm sm:text-base">
            <thead className="bg-slate-800/60">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-base font-semibold text-white sm:pl-6 sticky left-0 bg-slate-800/60 z-10">Task</th>
                <th scope="col" className="px-3 py-3.5 text-center text-base font-semibold text-slate-300">Manual</th>
                <th scope="col" className="px-3 py-3.5 text-center text-base font-semibold text-slate-300">Generic AI Builder</th>
                <th scope="col" className="px-3 py-3.5 text-center text-base font-semibold text-cyan-300">AltPage.ai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/70 bg-slate-900/40">
              {comparisonData.map((item, index) => (
                <tr key={index} className="hover:bg-slate-800/50 transition-colors duration-150">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 font-medium text-white sm:pl-6 sticky left-0 bg-inherit z-10">{item.task}</td>
                  <td className="whitespace-normal px-3 py-4 text-center text-slate-400">{item.manual}</td>
                  <td className="whitespace-normal px-3 py-4 text-center text-slate-400">{item.genericAI}</td>
                  <td className="whitespace-normal px-3 py-4 text-center text-cyan-400 font-medium">{item.altPageAI}</td>
                </tr>
              ))}
              {/* 结论行 - 再次强调 */}
              <tr className="bg-slate-800/70 border-t-2 border-purple-400">
                <td className="py-5 pl-4 pr-3 text-left text-base font-semibold text-white sm:pl-6 sticky left-0 bg-inherit z-10">Conclusion</td>
                <td className="px-3 py-5 text-center text-base font-medium text-slate-300 italic">{conclusionData.manual}</td>
                <td className="px-3 py-5 text-center text-base font-medium text-slate-300 italic">{conclusionData.genericAI}</td>
                <td className="px-3 py-5 text-center text-base font-bold text-white bg-purple-600">{conclusionData.altPageAI}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareTable;
