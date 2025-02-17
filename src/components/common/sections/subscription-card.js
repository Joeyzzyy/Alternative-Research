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
    <div className="w-full py-12 md:py-16">
      <div className="text-center max-w-7xl mx-auto px-4">
        {data.title && (
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {data.title}
          </h1>
        )}
        {data.subTitle && (
          <p className="mt-4 text-lg text-[#5C7299]">
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
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {data.bottomContent.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border-2 p-8 shadow-sm hover:shadow-md transition-all text-center ${
                plan.popular
                  ? 'border-[#4B89FF] ring-4 ring-[#4B89FF]/10 scale-[1.02]'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#4B89FF] to-[#6C9AFF] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MOST POPULAR ✨
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-baseline justify-center">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {plan.price[selectedPeriod] ? `$${plan.price[selectedPeriod]}` : 'Custom'}
                  </span>
                  {plan.price[selectedPeriod] && plan.price[selectedPeriod] !== 'Custom' && (
                    <span className="text-xl text-gray-500 ml-1">/mo</span>
                  )}
                  {selectedPeriod === 'yearly' && plan.discount && plan.price[selectedPeriod] && (
                    <span className="ml-2 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      Save {plan.discount}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-500 h-5">
                {plan.id !== 'enterprise' ? (
                  selectedPeriod === 'yearly' ? 'billed annually' : 'billed monthly'
                ) : 'Contact us for pricing details'}
              </p>

              <p className="mt-6 text-[#5C7299]">{plan.description}</p>

              <button className="mt-8 w-full py-3 px-6 rounded-xl text-white text-base font-medium bg-[#4B89FF] hover:bg-[#5C95FF] transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:bg-[#3A78FF]">
                {plan.buttonText}
              </button>

              {/* 功能列表 */}
              <div className="mt-8 space-y-6">
                {plan.features.map((section, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-semibold text-[#4B89FF] uppercase tracking-wide">
                      {section.title}
                    </h4>
                    <ul className="mt-4 space-y-4">
                      {section.items.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start justify-center text-left"
                        >
                          <i className="fas fa-check-circle text-[#4B89FF] mt-1 mr-3" />
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {feature}
                          </span>
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
  );
};

export default SubscriptionCard;
