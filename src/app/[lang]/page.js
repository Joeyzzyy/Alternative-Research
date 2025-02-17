import { notFound } from 'next/navigation';
import { ClientWrapper } from '../../components/layouts/client-wrapper';
import { headers } from 'next/headers';
import CommonLayout from '../../components/layouts/layout';
import Script from 'next/script'

// 1. 确保动态渲染
export const dynamic = 'force-dynamic'
// 2. 启用动态路由参数
export const dynamicParams = true
// 3. 完全禁用缓存
export const fetchCache = 'force-no-store'
// 4. 设置零秒缓存
export const revalidate = 0
// 添加支持的语言列表
const SUPPORTED_LANGUAGES = ['en', 'zh'];

// 主页面组件
export default async function ArticlePage({ params }) {
  try {
    const articleData = await getPageBySlug();

    if (!articleData?.data || articleData.data.publishStatus !== 'publish') {
      console.error(`Article not found or not published for slug: ${slug}`);
      return notFound();
    }
    
    const article = articleData.data;
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.updatedAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'WebsiteLM',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
      },
      image: article.coverImage,
      articleBody: article.content,
      keywords: article.pageStats?.genKeywords,
      articleSection: article.category,
      timeRequired: `PT${article.readingTime}M`
    };

    return (
      <>
        <Script id="article-schema" type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </Script>
        <ClientWrapper>
          <main className="flex-grow">
            <CommonLayout article={article} />
          </main>
        </ClientWrapper>
      </>
    );
  } catch (error) {
    console.error('Error in ArticlePage:', error);
    throw error;
  }
}

// 添加一个新的辅助函数来处理数组并返回逗号分隔的字符串
function joinArrayWithComma(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean).join(',') : '';
}

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { lang, slug } = resolvedParams;
    const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    const fullSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    const articleData = await getPageBySlug(fullSlug, currentLang);
    
    if (!articleData?.data || articleData.data.publishStatus !== 'publish') {
      return {
        title: 'Not Found',
        description: 'The page you are looking for does not exist.',
        robots: 'noindex, nofollow' 
      };
    }

    const article = articleData.data;
    const host = process.env.NEXT_PUBLIC_HOST || 'https://yourwebsite.com';
    const metadataBaseUrl = new URL(host);
    return {
      title: article.title, 
      description: article.description,
      keywords: joinArrayWithComma(article.pageStats?.genKeywords) ,
      robots: article.publishStatus === 'publish' ? 'index, follow' : 'noindex, nofollow',
      openGraph: { 
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.updatedAt,
        modifiedTime: article.updatedAt,  
        locale: lang,
        siteName: '',
        images: [{
          url: '',
          width: 1200,
          height: 630,
          alt: article.title
        }],
        article: {
          authors: [article.author],
          tags: article.pageStats?.genKeywords,
          section: article.category
        }
      },
      twitter: { 
        card: 'summary_large_image',
        title: article.title,
        description: article.description,
        images: article.coverImage,
        creator: ''
      },
      alternates: {
        canonical: "",
        languages: {
          'en': `${host}/${fullSlug}`,          // 英文版本不带语言标识符
          'zh': `${host}/zh/${fullSlug}`,       // 其他语言带语言标识符
        },
        hreflang: [
          {
            href: `${host}/${fullSlug}`,
            hrefLang: 'en'
          },
          {
            href: `${host}/zh/${fullSlug}`,
            hrefLang: 'zh'
          },
          {
            href: `${host}/${fullSlug}`,        // x-default 指向英文版本
            hrefLang: 'x-default'
          }
        ]
      },
      metadataBase: metadataBaseUrl,
      authors: [{ name: article.author }],
      category: article.category,
      other: {
        'article:published_time': article.createdAt,
        'article:modified_time': article.updatedAt,
        'article:section': article.category,
        'article:tag': joinArrayWithComma(article.pageStats?.genKeywords)
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while generating metadata.'
    };
  }
}

// 模拟数据获取函数
async function getPageBySlug() {
  const mockData = {
    data: {
      title: "AI SaaS Alternative Research Tool",
      description: "Comprehensive AI tool comparison platform",
      author: "AI Research Team",
      updatedAt: "2024-03-20T08:00:00.000Z",
      createdAt: "2024-03-20T08:00:00.000Z",
      publishStatus: "publish",
      // 添加 pageLayout 数据
      pageLayout: {
        "pageHeaders": {
            "actionItems": [
                {
                    "backgroundColor": "#1890FF",
                    "href": "https://app.websitelm.com",
                    "isExternal": false,
                    "key": "action-1737701586749-0.06931562237067479",
                    "label": "Get Started Now",
                    "textColor": "#FFFFFF",
                    "variant": "button"
                }
            ],
            "logo": {
                "alt": "Logo",
                "height": 40,
                "src": "https://websitelm-us-east-2.s3.us-west-2.amazonaws.com/67a9fabf538eb88a2247b5be/2025-02-12/yyigd21c58_20250208-171307.png?X-Amz-Algorithm=AWS4-HMAC-SHA256\u0026X-Amz-Credential=AKIA5VJ4LTRLHCNJWTFT%2F20250212%2Fus-west-2%2Fs3%2Faws4_request\u0026X-Amz-Date=20250212T061303Z\u0026X-Amz-Expires=604800\u0026X-Amz-SignedHeaders=host\u0026X-Amz-Signature=5bc9c83f3f9735b71a8d071829b760ba3fb48c88bb7636e1523638b4cd428d21",
                "width": 160
            },
            "mainMenuItems": [
                {
                    "children": [],
                    "color": "#000000",
                    "fontWeight": "600",
                    "isExternal": true,
                    "key": "menu-1738596569837-0.12142226513369181",
                    "label": "Pricing",
                    "link": "https://websitelm.com/pricing"
                },
                {
                    "children": [],
                    "color": "#000000",
                    "fontWeight": "600",
                    "isExternal": true,
                    "key": "menu-1738747749126-0.9226220998292718",
                    "label": "FAQ",
                    "link": "https://websitelm.com/faq"
                },
            ],
            "styles": {
                "backgroundColor": "#FFFFFF",
                "backgroundType": "solid",
                "gradientAngle": 184,
                "gradientEnd": "#FFFFFF",
                "gradientStart": "#FFFFFF"
            }
        },
        "pageFooters": {
            "colors": {
                "buttonBackground": "#006eff",
                "buttonText": "#FFFFFF",
                "companyName": "#111827",
                "copyright": "#111827",
                "description": "#111827",
                "featureLinks": "#111827",
                "featuresTitle": "#111827",
                "inputBackground": "#FFFFFF",
                "inputPlaceholder": "#9CA3AF",
                "newsletterText": "#FFFFFF",
                "newsletterTitle": "#FFFFFF"
            },
            "companyName": "WebsiteLM",
            "copyright": "© 2025 WebsiteLM. All rights reserved.",
            "description": "AI Website Generator \n- AI-crafted Content That Delivers Results.",
            "sections": [
                {
                    "colors": {
                        "links": "#9CA3AF",
                        "title": "#1F2937"
                    },
                    "links": [
                        {
                            "label": "Pricing",
                            "url": "https://websitelm.com/pricing"
                        },
                        {
                            "label": "FAQ",
                            "url": "https://websitelm.com/faq"
                        }
                    ],
                    "title": "Features"
                },
                {
                    "colors": {
                        "links": "#9CA3AF",
                        "title": "black"
                    },
                    "links": [
                        {
                            "label": "Terms and conditions",
                            "url": "https://websitelm.com/terms-and-conditions"
                        }
                    ],
                    "title": "Resources"
                }
            ],
            "socialMedia": {
                "iconColor": "#9CA3AF",
                "iconSize": 24,
                "links": [
                    {
                        "platform": "twitter",
                        "url": "https://x.com/YueZhu0719"
                    }
                ]
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "backgroundType": "solid",
                "gradientAngle": 135,
                "gradientEnd": "#1F2937",
                "gradientStart": "#000000"
            }
        }
      },
      sections: [
        {
          componentName: "ResearchTool",
          sectionId: "research-tool-1",
        },
        {
          componentName: "ProductBenefitsWithBlocks",
          sectionId: "benefits-1",
          leftContent: {
              buttonLink: "https://websitelm.com/features",
              buttonText: "Explore Features",
              description: "Make informed decisions with comprehensive AI tool comparisons and insights",
              title: "Why Choose Our AI Research Platform"
          },
          rightContent: [
              {
                  content: "Access detailed comparisons of 500+ AI tools with real-time updates on features, pricing, and user feedback. Our comprehensive database helps you find the perfect AI solution for your needs.",
                  icon: "mdi:database-search",
                  title: "Comprehensive Analysis"
              },
              {
                  content: "Save hours of research time with our side-by-side comparison tools. Easily evaluate multiple AI solutions across 50+ criteria including features, pricing, integration capabilities, and user reviews.",
                  icon: "mdi:clock-fast",
                  title: "Time-Saving Comparisons"
              },
              {
                  content: "Make data-driven decisions with our unbiased, detailed reviews and performance metrics. Get insights from real user experiences and expert evaluations.",
                  icon: "mdi:chart-bar",
                  title: "Data-Driven Insights"
              },
              {
                  content: "Stay ahead with daily updates on new AI tools, feature releases, and pricing changes. Get customized recommendations based on your specific requirements and industry.",
                  icon: "mdi:trending-up",
                  title: "Real-Time Updates"
              }
          ]
        },
        {
          componentName: "Faqs",
          sectionId: "faq-1",
          topContent: [
            {
              question: "How does your AI SaaS comparison tool work?",
              answer: "Our platform uses advanced algorithms to analyze and compare different AI SaaS solutions based on features, pricing, user reviews, and performance metrics. We continuously update our database to provide you with the most accurate and current information for making informed decisions."
            },
            {
              question: "What criteria do you use to evaluate AI tools?",
              answer: "We evaluate AI tools across multiple dimensions including:\n• Functionality and feature set\n• Pricing and value for money\n• Integration capabilities\n• Ease of use and learning curve\n• Customer support quality\n• Security and compliance\n• Performance and reliability"
            },
            {
              question: "How often is your comparison data updated?",
              answer: "Our database is updated daily through automated monitoring systems and manual verification. We track changes in features, pricing, and user feedback to ensure you always have access to the most current information about AI SaaS alternatives."
            },
            {
              question: "Can I compare specific AI tools side by side?",
              answer: "Yes! Our platform allows you to select multiple AI tools and compare them side by side across all relevant criteria. You can customize the comparison parameters to focus on the aspects that matter most to your needs."
            }
          ],
          bottomContent: {
            showButton: true,
            buttonText: "View All FAQs",
            buttonLink: "https://websitelm.com/faq"
          }
        },
        {
          componentName: "CallToAction",
          sectionId: "cta-1",
          title: "Stay Updated with the Latest AI Tool Comparisons",
          bottomContent: {
            inputPlaceholder: "Enter your work email",
            smallText: "Join 5,000+ professionals receiving our weekly AI tool insights",
            buttonText: "Subscribe Now"
          }
        }
      ]
    }
  };

  return mockData;
}