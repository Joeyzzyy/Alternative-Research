'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const SubscriptionCard = ({ data, theme = 'normal' }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('yearly');
  
  const billingPeriods = [
    { id: 'yearly', label: 'Annual · Save 20%' },
    { id: 'monthly', label: 'Monthly' }
  ];

  // Theme related functions
  const getTypographyStyles = () => {
    const typography = themeConfig[theme].typography;
    return {
      title: `${typography.h2.fontSize} ${typography.h2.fontWeight} ${typography.h2.color}`,
      subtitle: `${typography.h3.fontSize} ${typography.h3.fontWeight} ${typography.h3.color} mt-4 text-gray-600`
    };
  };

  return (
    <div className="bg-white py-24 relative overflow-hidden">
      {/* AI风格的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#818cf820_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#6366f120_0%,_transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.015]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center">
          {data.title && (
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 leading-tight">
              {data.title}
            </h2>
          )}
          {data.subTitle && (
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {data.subTitle}
            </p>
          )}

          {/* 计费周期切换 */}
          <div className="mt-12 flex justify-center">
            <div className="relative bg-gray-100 p-0.5 rounded-full flex">
              {billingPeriods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`relative py-2 px-6 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedPeriod === period.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* 订阅卡片列表 */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {data.bottomContent.plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-500 text-center 
                  backdrop-blur-sm bg-white/80 hover:translate-y-[-4px]
                  ${
                    plan.popular
                      ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/10 scale-[1.02] shadow-xl shadow-indigo-500/20'
                      : 'border border-slate-200 shadow-lg hover:shadow-xl hover:shadow-slate-200/40'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR ✨
                    </div>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mt-4">{plan.name}</h3>

                <div className="mt-4 flex items-baseline justify-center">
                  <div className="flex items-baseline">
                    <span className={`text-5xl font-bold tracking-tight ${
                      plan.popular ? 'text-indigo-600' : 'text-gray-900'
                    }`}>
                      {plan.price[selectedPeriod] ? `$${plan.price[selectedPeriod]}` : 'Custom'}
                    </span>
                    {plan.price[selectedPeriod] && plan.price[selectedPeriod] !== 'Custom' && (
                      <span className="text-xl text-gray-500 ml-1">/mo</span>
                    )}
                  </div>
                </div>

                {selectedPeriod === 'yearly' && plan.discount && plan.price[selectedPeriod] && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5h2v2H9v-2zm0-6h2v4H9V5z"/>
                      </svg>
                      Save {plan.discount}
                    </span>
                  </div>
                )}

                <p className="mt-4 text-gray-600">{plan.description}</p>

                <button className={`mt-8 w-full py-4 px-6 rounded-xl text-white text-base font-medium 
                  transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-purple-500/40' 
                    : 'bg-gray-900 hover:bg-gray-800 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30'
                  }`}>
                  {plan.buttonText}
                </button>

                {/* 功能列表 */}
                <div className="mt-8 space-y-6">
                  {plan.features.map((section, index) => (
                    <div key={index}>
                      <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 
                        ${plan.popular ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {section.title}
                      </h4>
                      <ul className="space-y-4">
                        {section.items.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <svg className={`w-5 h-5 mr-3 flex-shrink-0 
                              ${plan.popular ? 'text-indigo-600' : 'text-gray-600'}`} 
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600 text-left">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
