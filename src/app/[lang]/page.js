import { notFound } from 'next/navigation';
import { ClientWrapper } from '../../components/layouts/client-wrapper';
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
const SUPPORTED_LANGUAGES = ['en'];

// 主页面组件
export default async function ArticlePage({ params }) {
  try {
    const { lang } = params;
    const articleData = await getPageData();

    if (!articleData?.data || articleData.data.publishStatus !== 'publish') {
      console.error(`Article not found or not published`);
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
            <CommonLayout article={article} />
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
    const { lang } = resolvedParams;
    const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    const articleData = await getPageData();
    
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
      keywords: joinArrayWithComma(article.pageStats?.genKeywords),
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
          'en': `${host}`,          // 英文版本不带语言标识符
          'zh': `${host}/zh`,       // 其他语言带语言标识符
        },
        hreflang: [
          {
            href: `${host}`,
            hrefLang: 'en'
          },
          {
            href: `${host}/zh`,
            hrefLang: 'zh'
          },
          {
            href: `${host}`,        // x-default 指向英文版本
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

// 修改数据获取函数，完全移除参数
async function getPageData() {
  const mockData = {
    data: {
      title: "AltPage.ai - AI-Driven Competitor Alternative Pages",
      description: "AI pages that outrank, out-convert, and update themselves.",
      author: "Team altpage.ai",
      updatedAt: "2024-03-20T08:00:00.000Z",
      createdAt: "2024-03-20T08:00:00.000Z",
      publishStatus: "publish",
      pageLayout: {
        "pageHeaders": {
            "actionItems": [
                {
                    "backgroundColor": "#9333ea",
                    "href": "https://app.alternatively.websitelm.com",
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
                "src": "/images/alternatively-logo-tem.png",
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
                    "link": "https://alternatively.websitelm.com/pricing"
                },
                {
                    "children": [],
                    "color": "#000000",
                    "fontWeight": "600",
                    "isExternal": true,
                    "key": "menu-1738747749126-0.9226220998292718",
                    "label": "FAQ",
                    "link": "https://alternatively.websitelm.com/faq"
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
                "buttonBackground": "bg-gradient-to-r from-blue-600 to-purple-600",
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
            "companyName": "AltPage.ai",
            "copyright": "© 2025 AltPage.ai. All rights reserved.",
            "description": "The Best AI Alternative Research Tool.",
            "sections": [
                {
                    "colors": {
                        "links": "#9CA3AF",
                        "title": "#1F2937"
                    },
                    "links": [
                        {
                            "label": "Pricing",
                            "url": "https://altpage.ai/pricing"
                        },
                        {
                            "label": "FAQ",
                            "url": "https://altpage.ai/faq"
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
                            "url": "https://altpage.ai/terms-and-conditions"
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
                "backgroundType": "gradient",
                "gradientAngle": 45,
                "gradientStart": "#3B82F6",
                "gradientEnd": "#9333EA"
            }
        }
      },
      sections: [
        {
          componentName: "ResearchTool",
          sectionId: "research-tool",
        },
        {
          componentName: "FeatureIntro",
          sectionId: "the-problem"
        },
        {
          componentName: "HowItWorks",
          sectionId: "how-it-works"
        },
        {
          componentName: "KeyAdvantages",
          sectionId: "features"
        },
        {
          componentName: "CompareTable",
          sectionId: "compare-table-1"
        },
        {
          componentName: "ShowCase",
          sectionId: "show-case",
        },
        {
          componentName: "SubscriptionCard", 
          sectionId: "pricing",
        },
        {
          componentName: "Recommendations",
          sectionId: "recommendations-1",
        },
        {
          componentName: "Faqs",
          sectionId: "faq",
        },
        {
          componentName: "CallToAction",
          sectionId: "cta-1",
        },
      ]
    }
  };

  return mockData;
}