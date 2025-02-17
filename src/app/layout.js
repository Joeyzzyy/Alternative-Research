import './globals.css'

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
      </head>
      <body suppressHydrationWarning={true} className="w-full min-w-full overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
