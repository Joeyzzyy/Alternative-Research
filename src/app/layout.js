import './globals.css'
import { UserProvider } from '../contexts/UserContext';
import { ToolProvider } from '../contexts/ToolContext';
import Script from 'next/script';

export default async function RootLayout({ children, keywords }) {
  let faviconUrl = '/images/alternatively-favicon.png'; 

  return (
    <html lang="en" className="w-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta name="description" content="AltPage.ai leverages AI technology to identify high-performing alternative pages from competitors, providing actionable insights for digital marketing strategies." />
        <meta name="keywords" content={keywords || "AI competitor analysis, alternative page finder, SEO alternatives, website comparison tool, AI-driven marketing"} />
        <meta property="og:title" content="AltPage.ai - AI-Powered Competitor Analysis & Alternative Page Generator" />
        <meta property="og:description" content="Discover competitor search traffic using AI-driven analysis and competitor alternative pages generator." />
        <meta name="twitter:site" content="@YueZhu0719" />
        <title>AltPage.ai - AI-Driven Competitor Alternative Pages</title>
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
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5THNMDPJ');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning={true} className="w-full min-w-full overflow-x-hidden">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5THNMDPJ"
            height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe>
        </noscript>
        <UserProvider>
          <ToolProvider>
            {children}
          </ToolProvider>
        </UserProvider>
      </body>
    </html>
  )
}
