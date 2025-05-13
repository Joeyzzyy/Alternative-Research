import './globals.css'
import { UserProvider } from '../contexts/UserContext';
import { ToolProvider } from '../contexts/ToolContext';

export default async function RootLayout({ children, keywords }) {
  let faviconUrl = '/images/alternatively-favicon.png'; 

  return (
    <html lang="en" className="w-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
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
        {/* <!-- Google Tag Manager --> */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5THNMDPJ');`}} />
        {/* <!-- End Google Tag Manager --> */}
      </head>
      <body suppressHydrationWarning={true} className="w-full min-w-full overflow-x-hidden">
        {/* <!-- Google Tag Manager (noscript) --> */}
        <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5THNMDPJ"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`}} />
        {/* <!-- End Google Tag Manager (noscript) --> */}
        <UserProvider>
          <ToolProvider>
            {children}
          </ToolProvider>
        </UserProvider>
      </body>
    </html>
  )
}
