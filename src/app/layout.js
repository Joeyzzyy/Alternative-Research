import './globals.css'
import { headers } from 'next/headers';
import { getDomainFavicon } from '../lib/api/index';

// 复用相同的域名处理函数
function extractMainDomain(host) {
  const domainWithoutPort = host?.split(':')[0] || '';
  const parts = domainWithoutPort.split('.');
  if (parts.length < 2) {
    return domainWithoutPort;
  }
  return parts.slice(-2).join('.');
}

function getCurrentDomain() {
  // 判断是否为测试环境
  if (process.env.NODE_ENV === 'development') {
    return 'websitelm.com';
  }
  
  const headersList = headers();
  const host = headersList.get('host');
  return extractMainDomain(host) || 'websitelm.com';
}

async function getSiteConfig(domain) {
  try {
    const response = await getDomainFavicon(domain);
    // 直接返回response数据，因为它已经包含了所需的结构
    return response;
  } catch (error) {
    console.error('Error fetching site config:', error);
    return null;
  }
}

export default async function RootLayout({ children, keywords, robots }) {
  const domain = getCurrentDomain();
  let faviconUrl = '/default-favicon.ico';  // 默认favicon
  
  try {
    const siteConfig = await getSiteConfig(domain);
    // 检查返回的数据结构中的favicon路径
    if (siteConfig?.code === 200 && siteConfig?.data?.favicon) {
      faviconUrl = siteConfig.data.favicon;
    }
  } catch (error) {
    console.error('Error in RootLayout:', error);
  }

  return (
    <html lang="en">
      <head>
        <meta name="keywords" content={keywords} />
        <link 
          rel="icon" 
          href={faviconUrl} 
          type="image/x-icon"
        />
        <link 
          rel="shortcut icon" 
          href={faviconUrl} 
          type="image/x-icon"
        />
      </head>
      <body suppressHydrationWarning={true} style={{ overflowX: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
