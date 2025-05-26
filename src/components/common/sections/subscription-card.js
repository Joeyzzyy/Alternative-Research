'use client';
import React from 'react';
import apiClient from '../../../lib/api/index.js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Modal, Button, Input, message as antdMessage } from 'antd';
import LoginModal from './login-modal.js';

const stripePromise = loadStripe('pk_live_51QzBUgG7uNS0P061vxzgyNH6xBkE2jb3R8myNWI61y288DupEs9W0asrS5gtlIubp6sCCEaIrXSVvyVG3z4DjBAU00ISuF1DvJ');

const SubscriptionCard = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('yearly');
  const [plans, setPlans] = React.useState([]);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  
  const billingPeriods = [
    { id: 'yearly', label: 'Annual · Save 20%' },
    { id: 'monthly', label: 'Monthly' }
  ];

  const [isLoggedIn, setIsLoggedIn] = React.useState(
    typeof window !== 'undefined' && !!localStorage.getItem('alternativelyAccessToken')
  );

  const handleLoginSuccess = (userInfo) => {
    localStorage.setItem('alternativelyAccessToken', userInfo.accessToken);
    localStorage.setItem('alternativelyIsLoggedIn', 'true');
    localStorage.setItem('alternativelyCustomerEmail', userInfo.email);
    localStorage.setItem('alternativelyCustomerId', userInfo.customerId);

    setIsLoggedIn(true);
    setShowLoginModal(false);
    messageApi.success('Login successful!');
    window.dispatchEvent(new CustomEvent('alternativelyLoginSuccess'));
  };

  React.useEffect(() => {
    apiClient.getPackageFeatures().then(res => {
      if (!res || !Array.isArray(res.data)) return;

      const filtered = res.data.filter(pkg =>
        [
          'Standard-Annual',
          'Standard-Monthly',
          'Professional-Annual',
          'Professional-Monthly',
          'Testing-Standard-Monthly'
        ].includes(pkg.packageName.trim())
      );

      // 归类
      const planMap = {
        Standard: { monthly: null, yearly: null },
        Professional: { monthly: null, yearly: null },
        Testing: { monthly: null }
      };

      filtered.forEach(pkg => {
        const trimmedPackageName = pkg.packageName.trim();
        if (trimmedPackageName.startsWith('Standard')) {
          if (trimmedPackageName.endsWith('Monthly')) {
            planMap.Standard.monthly = pkg;
          } else {
            planMap.Standard.yearly = pkg;
          }
        } else if (trimmedPackageName.startsWith('Professional')) {
          if (trimmedPackageName.endsWith('Monthly')) {
            planMap.Professional.monthly = pkg;
          } else {
            planMap.Professional.yearly = pkg;
          }
        } else if (trimmedPackageName === 'Testing-Standard-Monthly') {
          planMap.Testing.monthly = pkg;
        }
      });

      const standardPlan = {
        name: "Standard",
        price: {
          monthly: planMap.Standard.monthly?.packagePrice ?? '-',
          yearly: planMap.Standard.yearly?.packagePrice ?? '-'
        },
        description: "Everything you need to start creating alternative pages",
        buttonText: "Choose This Plan",
        popular: false,
        features: [
          {
            title: "Features include:",
            items: [
              <>
                <span className="font-bold text-2xl text-cyan-400 inline-block animate-bounce-subtle">100</span> credits/month (approx. <span className="font-bold text-2xl text-cyan-400 inline-block animate-bounce-subtle">10</span> pages for alternative page or blog generation)
              </>,
              `Generate up to ${planMap.Standard.monthly?.pageLimit ?? 10} pages in total /month`,
              `Freely hosting ${planMap.Standard.monthly?.pageLimit ?? 10} pages on our server`,
              "Auto images grabbing and matching",
              "Auto internal links insertion",
              "AI page design and generation",
              "Standard support",
              "1 Free onboarding call"
            ]
          }
        ],
        priceId: {
          monthly: planMap.Standard.monthly?.priceId,
          yearly: planMap.Standard.yearly?.priceId
        },
        packageFeatureId: {
          monthly: planMap.Standard.monthly?.packageFeatureId,
          yearly: planMap.Standard.yearly?.packageFeatureId
        }
      };

      const professionalPlan = {
        name: "Professional",
        price: {
          monthly: planMap.Professional.monthly?.packagePrice ?? '-',
          yearly: planMap.Professional.yearly?.packagePrice ?? '-'
        },
        description: "Perfect for teams scaling alternative page production",
        buttonText: "Choose This Plan",
        popular: true,
        features: [
          {
            title: "Everything in Standard, plus:",
            items: [
              <>
                <span className="font-bold text-2xl text-purple-400 inline-block animate-bounce-subtle">300</span> credits/month (approx. <span className="font-bold text-2xl text-purple-400 inline-block animate-bounce-subtle">30</span> pages for alternative page or blog generation)
              </>,
              `Generate up to ${planMap.Professional.monthly?.pageLimit ?? 30} pages in total /month`,
              `Freely hosting ${planMap.Professional.monthly?.pageLimit ?? 30} pages on our server`,
              "Auto images grabbing and matching",
              "Auto internal links insertion",
              "AI page design and generation",
              "Priority page generation",
              "Pro features:",
              "More alternative pages generation",
              "Unlimited Page Section Re-generation",
              "Priority support"
            ]
          }
        ],
        priceId: {
          monthly: planMap.Professional.monthly?.priceId,
          yearly: planMap.Professional.yearly?.priceId
        },
        packageFeatureId: {
          monthly: planMap.Professional.monthly?.packageFeatureId,
          yearly: planMap.Professional.yearly?.packageFeatureId
        }
      };

      // 定义 Free Trial 套餐对象 (复制 Standard 权益并修改)
      const freeTrialPlan = {
        name: "Free Trial",
        price: { monthly: 0, yearly: 0 },
        description: "Start exploring with 50 free credits to get started",
        buttonText: "Start Generating Now",
        popular: false,
        features: [
          {
            title: "Features include:",
            items: [
              <>
                <span className="font-bold text-2xl text-emerald-400 inline-block animate-bounce-subtle">50</span> credits/month (approx. <span className="font-bold text-2xl text-emerald-400 inline-block animate-bounce-subtle">5</span> pages for alternative page or blog generation)
              </>,
              `Generate up to ${Math.ceil((planMap.Standard.monthly?.pageLimit ?? 30) / 6)} pages in total /month`,
              `Freely hosting ${Math.ceil((planMap.Standard.monthly?.pageLimit ?? 30) / 6)} pages on our server`,
              ...(standardPlan.features[0].items.slice(3))
            ]
          }
        ],
        planId: 'free-trial'
      };

      // 定义 Test 套餐对象 (如果存在)
      let testPlan = null;
      if (planMap.Testing.monthly) {
        testPlan = {
          name: "Test (0.01 USD)",
          price: {
            monthly: planMap.Testing.monthly?.packagePrice ?? '-',
            yearly: '-'
          },
          description: "For payment testing only. No real service will be provided.",
          buttonText: "Choose Test Plan",
          popular: false,
          features: [
            {
              title: "Test Features",
              items: [
                "Only for payment test",
                "No real service",
                "You can verify payment flow with this plan"
              ]
            }
          ],
          priceId: {
            monthly: planMap.Testing.monthly?.priceId
          },
          packageFeatureId: {
            monthly: planMap.Testing.monthly?.packageFeatureId
          }
        };
      }

      // 组合最终的套餐列表: Free Trial 在最前，然后是 Standard, Professional
      const combinedPlans = [freeTrialPlan, standardPlan, professionalPlan];
      // if (testPlan) {
      //   combinedPlans.push(testPlan);
      // }
      setPlans(combinedPlans);
    });
  }, []);

  const displayData = {
    title: "Simple, Transparent Pricing",
    subTitle: "Choose the plan that's right for you",
    bottomContent: {
      plans: plans
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.planId === 'free-trial') {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // 使用平滑滚动效果
      return; 
    }

    if (localStorage.getItem('alternativelyIsLoggedIn') !== 'true') {
      setShowLoginModal(true);
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  return (
    <>
      {contextHolder}
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
            <div className="mt-12 grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
              {displayData.bottomContent.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl p-8 transition-all duration-500 text-center
                    backdrop-blur-sm
                    ${
                      plan.popular
                        ? 'bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-2 border-purple-500/50 ring-4 ring-purple-500/10 scale-[1.02] shadow-xl shadow-purple-500/20'
                        : plan.name === "Free Trial"
                          ? 'bg-slate-900/70 border border-slate-700/50 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10'
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
                    <span className={`text-5xl font-extrabold tracking-tight
                      ${plan.popular
                        ? 'bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent'
                        : plan.name === "Free Trial"
                          ? 'text-emerald-400'
                          : 'text-cyan-400'
                      }
                    `}>
                      {plan.name === "Free Trial" ? '$0' : `$${plan.price[selectedPeriod]}`}
                    </span>
                    {plan.name !== "Free Trial" && (
                      <span className="text-lg text-gray-400 font-medium">/mo</span>
                    )}
                  </div>

                  <p className="mt-4 text-gray-300">{plan.description}</p>

                  <div className="mt-8 relative group">
                    <div className={`absolute -inset-0.5 rounded-xl blur-sm bg-gradient-to-r ${
                      plan.popular
                        ? 'from-purple-500 via-fuchsia-500 to-rose-500 opacity-70 group-hover:opacity-100'
                        : plan.name === "Free Trial"
                          ? 'from-emerald-500 to-green-500 opacity-50 group-hover:opacity-70'
                          : 'from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-70'
                      } transition duration-300`}></div>
                    <button
                      className={`relative w-full py-4 px-6 rounded-xl text-white text-base font-medium bg-slate-900
                        transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {plan.buttonText || 'Select Plan'}
                    </button>
                  </div>

                  {/* Feature list */}
                  <div className="mt-8 space-y-6">
                    {plan.features.map((section, index) => (
                      <div key={index}>
                        <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4
                          ${plan.popular
                            ? 'text-purple-400'
                            : plan.name === "Free Trial"
                              ? 'text-emerald-400'
                              : 'text-cyan-400'
                          }`}>
                          {section.title}
                        </h4>
                        <ul className="space-y-4">
                          {section.items.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start">
                              <div className={`w-5 h-5 mr-3 rounded-full flex-shrink-0 flex items-center justify-center
                                ${plan.popular
                                  ? 'bg-purple-500/20'
                                  : plan.name === "Free Trial"
                                    ? 'bg-emerald-500/20'
                                    : 'bg-cyan-500/20'
                                }`}>
                                <svg className={`w-3.5 h-3.5
                                  ${plan.popular
                                    ? 'text-purple-400'
                                    : plan.name === "Free Trial"
                                      ? 'text-emerald-400'
                                      : 'text-cyan-400'
                                  }`}
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
      <Elements stripe={stripePromise}>
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan}
          period={selectedPeriod}
          onSuccess={() => {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      </Elements>
      <LoginModal
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        isLoginForm={true}
        setIsLoginForm={() => {}} // 你可以根据需要实现
        isForgotPassword={false}
        setIsForgotPassword={() => {}} // 你可以根据需要实现
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

function PaymentModal({ visible, onClose, plan, period, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [cardError, setCardError] = React.useState('');
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setCardError('');
    try {
      const cardElement = elements.getElement(CardElement);
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name,
          email,
          address: { postal_code: postalCode }
        }
      });
      if (error) {
        setCardError(error.message);
        setProcessing(false);
        return;
      }

      // 调用后端创建订阅
      const customerId = localStorage.getItem('alternativelyCustomerId');
      if (!customerId) {
        messageApi.error('Customer ID not found. Please log in again.');
        setProcessing(false);
        return;
      }

      const res = await apiClient.createSubscription({
        customerId,
        email,
        name,
        packageId: plan.packageFeatureId[period],
        paymentMethodId: paymentMethod.id,
      });

      // 1. 检查业务逻辑是否完全成功 (body code 为 200)
      if (res?.code === 200) {
        messageApi.success('Subscription successful!');
        onSuccess();
        onClose();
        // 成功关闭，无需设置 processing
      }
      // 2. 明确处理业务逻辑失败，body code 为 400 的情况
      else if (res?.code === 400) {
        console.error('Subscription failed (body code 400):', res);
        // 使用后端返回的具体错误信息
        messageApi.error(res?.message || 'Invalid request. Please check your input and try again.');
        setProcessing(false); // 停止处理，允许用户修改
      }
      // 3. 处理其他未预期的 body code (如果 HTTP 是 200)
      else {
        console.error('Subscription failed (unexpected body code):', res);
        messageApi.error(res?.message || 'An unexpected error occurred during subscription. Please try again later.');
        setProcessing(false); // 停止处理
      }
      // --- 结束修改 ---

    } catch (err) {
      // 处理网络错误、请求本身失败 (非 200 HTTP 状态码) 或其他意外异常
      console.error('Payment submission failed (network/HTTP error):', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
      messageApi.error(`Payment failed: ${errorMessage}`);
      setProcessing(false); // 停止处理
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={() => !processing && onClose()}
      footer={null}
      title="Complete Your Subscription"
      centered
      width={520}
      maskClosable={!processing}
    >
      {contextHolder}
      <div style={{
        padding: 0,
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden"
      }}>
        {/* 价格展示区 */}
        <div style={{
          background: "#f5f7fa",
          padding: "24px 24px 16px 24px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
              {plan?.name} Plan
            </div>
            <div style={{ color: "#888", fontSize: 15, marginBottom: 8 }}>
              {period === 'yearly' ? 'Annual Billing' : 'Monthly Billing'}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#6f3ff5"
              }}>
                ¥{plan?.price?.[period] ?? '-'}
              </span>
              <span style={{ color: "#888", fontSize: 16 }}>/mo</span>
            </div>
          </div>
          {period === 'yearly' && plan?.price?.[period] && !isNaN(Number(plan.price[period])) && (
            <div style={{
              marginLeft: 24,
              padding: "8px 16px",
              background: "#ede9fe",
              borderRadius: 8,
              fontWeight: 600,
              color: "#6f3ff5",
              fontSize: 16,
              minWidth: 120,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 13, color: "#888", fontWeight: 400, marginBottom: 2 }}>Total per year</div>
              <div>¥{Math.round(Number(plan.price[period]) * 12 * 100) / 100}</div>
            </div>
          )}
        </div>
        {/* 表单区 */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
              Payment Information
            </div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
              Please enter your details to complete the subscription.
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500 }}>Full Name</label>
              <Input
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500 }}>Email Address</label>
              <Input
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500 }}>Postal Code</label>
              <Input
                placeholder="Postal code"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500 }}>Card Information</label>
              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: 12,
                marginTop: 4,
                background: '#fafbfc'
              }}>
                <CardElement
                  options={{
                    style: {
                      base: { fontSize: '16px', color: '#32325d', '::placeholder': { color: '#bfbfbf' } },
                      invalid: { color: '#fa755a' }
                    }
                  }}
                  onChange={e => setCardError(e.error ? e.error.message : '')}
                />
              </div>
              {cardError && <div style={{ color: '#fa755a', marginTop: 8, fontSize: 13 }}>{cardError}</div>}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose} disabled={processing}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={processing}
              onClick={handleSubmit}
              disabled={!stripe || !elements || processing}
              style={{ minWidth: 160, fontWeight: 700, fontSize: 16 }}
            >
              {processing ? 'Processing Payment...' : 'Confirm & Subscribe'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SubscriptionCard;