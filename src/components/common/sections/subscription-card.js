'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const SubscriptionCard = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('yearly');
  
  const billingPeriods = [
    { id: 'yearly', label: 'Annual · Save 20%' },
    { id: 'monthly', label: 'Monthly' }
  ];

  const displayData = {
    title: "While You Enjoy Your Free Pro Trial, Explore Our Plans",
    subTitle: "Compare our plans and features to see how Pro plan benefits can help grow your business.",
    bottomContent: {
      plans: [
        {
          name: "Standard",
          price: { 
            monthly: "45",
            yearly: "36"
          },
          discount: "20%",
          description: "Everything you need to start creating alternative pages",
          buttonText: "Coming Soon...",
          popular: false,
          features: [
            {
              title: "Features include:",
              items: [
                "30 alternative pages generation & style change/month",
                "Auto AI images generation",
                "Auto internal links insertion",
                "AI page design and generation",
                "Standard support",
                "1 Free onboarding call"
              ]
            }
          ]
        },
        {
          name: "Professional",
          price: {
            monthly: "129",
            yearly: "99"
          },
          discount: "23%",
          description: "Perfect for teams scaling alternative page production",
          buttonText: "Coming Soon...",
          popular: true,
          features: [
            {
              title: "Everything in Standard, plus:",
              items: [
                "100 alternative pages generation/month",
                "Auto AI images generation",
                "Auto internal links insertion",
                "AI page design and generation",
                "Priority page generation"
              ]
            },
            {
              title: "Pro features:",
              items: [
                "More alternative pages generation",
                "Unlimited Page Section Re-generation",
                "Unlimited onboarding calls",
                "Priority support"
              ]
            }
          ]
        }
      ]
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center">
          {displayData.title && (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              {displayData.title}
            </h2>
          )}
          {displayData.subTitle && (
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {displayData.subTitle}
            </p>
          )}

          {/* Billing period toggle */}
          <div className="mt-12 flex justify-center">
            <div className="relative bg-slate-800/50 backdrop-blur-sm p-1 rounded-full flex border border-slate-700/50">
              {billingPeriods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`relative py-2 px-6 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedPeriod === period.id
                      ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 text-white shadow-inner shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {selectedPeriod === period.id && (
                    <span className="absolute inset-0 rounded-full bg-slate-700/50 backdrop-blur-sm" />
                  )}
                  <span className="relative">{period.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subscription cards */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {displayData.bottomContent.plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-500 text-center 
                  backdrop-blur-sm 
                  ${
                    plan.popular
                      ? 'bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-2 border-purple-500/50 ring-4 ring-purple-500/10 scale-[1.02] shadow-xl shadow-purple-500/20'
                      : 'bg-slate-900/70 border border-slate-700/50 shadow-lg shadow-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/10'
                  }
                  hover:translate-y-[-4px]`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20">
                      MOST POPULAR ✨
                    </div>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mt-4">{plan.name}</h3>

                <div className="mt-8 mb-4 flex items-center justify-center space-x-4">
                  <span className={`text-4xl font-extrabold tracking-tight
                    ${plan.popular ? 'bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent' : 'text-cyan-400'}
                  `}>
                    ${plan.price[selectedPeriod]}
                  </span>
                  <span className="text-lg text-gray-400 font-medium">/mo</span>
                  <span className="mx-2">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="relative flex items-center">
                    <span className="absolute -left-4 -top-2 opacity-40 pointer-events-none">
                      <svg className="w-10 h-10 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046a1 1 0 00-1.6 0l-7 10A1 1 0 003 13h5v5a1 1 0 001.6.8l7-10A1 1 0 0017 7h-5V2a1 1 0 00-.7-.954z"/>
                      </svg>
                    </span>
                    <span className={`
                      text-5xl font-extrabold tracking-tight drop-shadow-lg animate-bounce
                      ${plan.popular 
                        ? 'bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-cyan-300 via-blue-400 to-green-400 bg-clip-text text-transparent'
                      }
                    `}>
                      {plan.name === "Standard" && "30"}
                      {plan.name === "Professional" && "100"}
                    </span>
                  </span>
                  <span className="text-base text-gray-300 ml-1">alterpages/month</span>
                </div>

                <p className="mt-4 text-gray-300">{plan.description}</p>

                <div className="mt-8 relative group">
                  <div className={`absolute -inset-0.5 rounded-xl blur-sm bg-gradient-to-r ${
                    plan.popular 
                      ? 'from-purple-500 via-fuchsia-500 to-rose-500 opacity-70 group-hover:opacity-100' 
                      : 'from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-70'
                    } transition duration-300`}></div>
                  <button className={`relative w-full py-4 px-6 rounded-xl text-white text-base font-medium bg-slate-900
                    transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0`}>
                    {plan.buttonText}
                  </button>
                </div>

                {/* Feature list */}
                <div className="mt-8 space-y-6">
                  {plan.features.map((section, index) => (
                    <div key={index}>
                      <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 
                        ${plan.popular ? 'text-purple-400' : 'text-cyan-400'}`}>
                        {section.title}
                      </h4>
                      <ul className="space-y-4">
                        {section.items.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <div className={`w-5 h-5 mr-3 rounded-full flex-shrink-0 flex items-center justify-center
                              ${plan.popular ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                              <svg className={`w-3.5 h-3.5 
                                ${plan.popular ? 'text-purple-400' : 'text-cyan-400'}`} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-300 text-left">{feature}</span>
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