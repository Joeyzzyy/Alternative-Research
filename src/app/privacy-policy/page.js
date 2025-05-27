'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">Privacy Policy for AltPage.ai</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              AltPage.ai ("AltPage.ai", "we", "us" or "our") is a SaaS platform designed for AI-driven programmatic SEO and content creation. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains what information we collect, how we use and share it, and the measures we take to safeguard your data. It also outlines your rights under applicable data protection laws, such as the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). By using AltPage.ai's services, you agree to the practices described in this Privacy Policy. (Effective Date: March 12, 2025)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect various types of information to provide and improve our services. This includes:
            </p>
            
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Personal Information</h3>
                <p className="text-gray-300 leading-relaxed">
                  When you register for an account or contact us, we collect personal details such as your name, email address, password, and any profile information you choose to provide. If you subscribe to a paid plan, we may also collect billing details like your company name and payment information (note: credit card numbers are handled by our payment processor, not stored on our servers).
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Content and Usage Data</h3>
                <p className="text-gray-300 leading-relaxed">
                  We collect content you create or upload to AltPage.ai – for example, website URLs you submit for analysis, text and images for landing pages or blog posts, and knowledge base materials. We also collect data on how you use our platform, such as the pages you generate, features you use, and time spent on the platform. This helps us optimize our services.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Third-Party Integration Data</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you choose to integrate third-party services with AltPage.ai, we collect data from those services on your behalf. For example, AltPage.ai can connect to your Google Search Console account to retrieve your website's indexing, ranking, and traffic data for SEO analysis. Any data obtained from integrated third parties will be used solely to provide the requested functionality.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Automatic Analytics Data</h3>
                <p className="text-gray-300 leading-relaxed">
                  Like most web applications, we automatically collect certain technical information when you use AltPage.ai. This includes your IP address, browser type, device identifiers, operating system, referring URLs, and cookies (see Cookies and Tracking Technologies below). This data helps us secure the platform, fix bugs, and understand user interactions (e.g., which features are most popular).
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Communication Records</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you communicate with us (for example, via customer support inquiries or feedback forms), we will collect and retain those communications and any information you choose to provide within them (such as contact details and the content of your messages).
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">To Provide and Improve the Service</h3>
                <p className="text-gray-300 leading-relaxed">
                  We process your personal and content data to create and maintain your account, generate SEO-optimized content, analyze your website and competitors, and generally operate the AltPage.ai platform. This includes using AI algorithms on your content to deliver features like automated landing page and blog post generation, as well as providing SEO performance reports. We also use data to refine our algorithms and improve our services over time.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Personalization and User Experience</h3>
                <p className="text-gray-300 leading-relaxed">
                  Your information helps us personalize the service to your needs – for example, recommending keywords or content strategies based on your industry and usage. It also allows us to customize the user interface and content recommendations to enhance your experience.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Communication</h3>
                <p className="text-gray-300 leading-relaxed">
                  We use contact information (email address, etc.) to send you service-related communications. These include confirmations, technical notices, updates about new features or changes, security alerts, and administrative messages. If you have opted in to receive marketing communications, we may also send newsletters or offers about AltPage.ai's products; you can opt out of marketing emails at any time.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Transactions and Billing</h3>
                <p className="text-gray-300 leading-relaxed">
                  For customers on paid plans, we use your information to process subscription payments and manage billing through our secure third-party payment processor. We might also send invoices, payment confirmations, or notify you of issues with your account status.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Integrations You Enable</h3>
                <p className="text-gray-300 leading-relaxed">
                  When you connect third-party services (such as Google Search Console), we use the data from those services to provide integrated functionality – for instance, displaying your Google Search Console analytics within our dashboard. We access and use such third-party data solely to support the features you have activated, in accordance with the permissions you granted.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Security and Fraud Prevention</h3>
                <p className="text-gray-300 leading-relaxed">
                  Information (especially technical and usage data) is used to monitor for suspicious activities and to maintain the security of our platform. This includes detecting and preventing fraudulent behavior, abuse, or violations of our Terms.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Legal Compliance</h3>
                <p className="text-gray-300 leading-relaxed">
                  In certain cases, we may need to use your data to comply with applicable laws and regulations, or to respond to lawful requests or court orders. For example, we may retain transaction records for tax and accounting purposes, or use information to enforce our agreements and protect the rights and safety of our users and our company.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Sharing of Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not sell your personal information to third parties. However, we do share information in certain circumstances, as described below, and always with appropriate safeguards:
            </p>
            
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Service Providers</h3>
                <p className="text-gray-300 leading-relaxed">
                  We share data with trusted third-party service providers who perform services on our behalf. This includes cloud hosting providers (for data storage and servers), payment processors (to handle billing securely), email delivery services (to send verification or notification emails), customer support platforms, analytics services, and AI processing services. These providers only receive the information necessary to carry out their specific tasks, and they are contractually obligated to protect your data and use it only for our specified purposes.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Third-Party Integrations</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you connect a third-party account or service to AltPage.ai, we may share certain data with that service or receive data from it, as needed to enable the integration. For instance, to provide our Google Search Console integration, we exchange information with Google's APIs using secure tokens you provide, in order to pull in your site performance data. We do not disclose your credentials to anyone, and you can revoke integration access at any time through your account settings with us or the third party.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Business Transfers</h3>
                <p className="text-gray-300 leading-relaxed">
                  In the event that AltPage.ai undergoes a business transaction such as a merger, acquisition, corporate reorganization, or sale of assets, your personal information may be transferred to the successor entity as part of that transaction. If such a transfer occurs, we will ensure the recipient respects your personal data in a manner consistent with this Privacy Policy. We will notify you (for example, via email or a prominent notice on our site) of any change in ownership or uses of your personal information as a result of a business transition.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Legal Obligations and Protection</h3>
                <p className="text-gray-300 leading-relaxed">
                  We may disclose your information if required to do so by law or in response to valid legal process (e.g., a subpoena, warrant, or court order). We may also share information when we believe in good faith that disclosure is necessary to protect our rights, property, or safety, or that of our users or others. This can include sharing information with law enforcement or regulators (for example, investigating fraud or security incidents).
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">With Your Consent</h3>
                <p className="text-gray-300 leading-relaxed">
                  Apart from the scenarios above, we will request your consent before using or sharing your personal information for any purpose that is not covered by this Privacy Policy. For example, if we ever want to post user testimonials or case studies that include personal information, we would obtain your explicit permission.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed mt-4">
              Importantly, we do not rent or trade your personal information to third parties for their own marketing purposes. We also have no "selling" of personal data as defined under applicable privacy laws, and thus no need to offer an opt-out of sale (since we do not engage in such activity).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Data Retention</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We retain your personal data only as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. This means we will keep your information for as long as your account is active or as needed to provide you with our services. For example, content you have created on the platform will remain stored until you delete it or your account, so that you can access and manage it.
            </p>
            <p className="text-gray-300 leading-relaxed">
              If you choose to delete your AltPage.ai account, or if you request that we delete your personal information, we will take steps to remove or anonymize your data from our active systems. Please note that we may retain certain information for legitimate business or legal purposes after account deletion. For instance, we might keep transaction records for accounting, maintain logs to comply with security or legal requirements, or retain backup copies for a limited time. When we no longer have a need for your data, we will securely dispose of it or anonymize it so that it can no longer be associated with you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Security Measures</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We take the security of your data seriously and implement a range of technical and organizational measures to protect it. These include, for example:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Encryption</h3>
                <p className="text-gray-300 leading-relaxed">
                  All communications with the AltPage.ai web application occur over HTTPS, which means data is encrypted in transit between your device and our servers. We also employ encryption or hashing for sensitive data at rest (such as user passwords, which are stored in hashed form). Using encryption and secure protocols helps safeguard data against unauthorized access.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Access Controls</h3>
                <p className="text-gray-300 leading-relaxed">
                  We restrict access to personal information to authorized personnel who need it to operate or improve our services. Our team is trained on data privacy and security practices, and all staff and contractors are bound by confidentiality obligations.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Network & Application Security</h3>
                <p className="text-gray-300 leading-relaxed">
                  Our platform is built with security in mind. We use firewalls and monitoring tools to protect our network and regularly update our software to patch vulnerabilities. We conduct periodic security audits, tests, and assessments of our systems. Any detected issues are addressed promptly to maintain a high level of protection.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Secure Hosting</h3>
                <p className="text-gray-300 leading-relaxed">
                  AltPage.ai's infrastructure is hosted on reputable cloud services that offer robust physical and environmental security controls. Data centers are secured against unauthorized access and have disaster recovery plans.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Third-Party Security</h3>
                <p className="text-gray-300 leading-relaxed">
                  When we use third-party service providers (e.g., for payments or cloud storage), we choose vendors who meet industry security standards (for example, payment processors that are PCI-DSS compliant). We ensure through contracts that these vendors also commit to protecting your data.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed mt-4">
              Despite our efforts, no method of transmission over the internet or electronic storage is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot guarantee absolute security. We encourage you to use a strong, unique password for your AltPage.ai account and to notify us immediately if you suspect any unauthorized access to your account or data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">User Rights and Choices</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have rights and choices regarding your personal information. We strive to honor these rights in accordance with applicable laws:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Access and Correction</h3>
                <p className="text-gray-300 leading-relaxed">
                  You have the right to access the personal information we hold about you and to request correction of any inaccuracies. This means you can ask us for a copy of your data, and you can update or correct your account information at any time through your profile settings or by contacting us.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Deletion (Right to Be Forgotten)</h3>
                <p className="text-gray-300 leading-relaxed">
                  You may request that we delete your personal data. When you delete your account or ask for deletion, we will remove your personal information from our active systems (while noting that some data may be retained as explained in the Data Retention section).
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Data Portability</h3>
                <p className="text-gray-300 leading-relaxed">
                  To the extent required by law, you have the right to obtain your personal data in a portable format. We can provide an export of your account data upon request, so you can move it to another service if needed.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Objection and Restriction</h3>
                <p className="text-gray-300 leading-relaxed">
                  In certain situations, you have the right to object to or restrict our processing of your data. For example, you can ask us to stop using your information for direct marketing, and we will honor that request. If we are processing your data based on legitimate interests, you can object if you believe your rights outweigh our interests.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Consent Withdrawal</h3>
                <p className="text-gray-300 leading-relaxed">
                  If we rely on your consent to process any personal information (such as for optional marketing emails or certain integrations), you have the right to withdraw that consent at any time. Withdrawing consent will not affect the lawfulness of any processing we already performed, and it may mean some features (like a connected service) can no longer function for you.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed mt-4">
              These rights may vary depending on your location. For instance, if the GDPR or CCPA applies to your personal information, you may have the right to access and correct your data, to object to our processing, and to request deletion. California residents have specific rights under the CCPA, including the right to know the categories of personal information collected, the right to request deletion of personal information, and the right to opt out of the sale of personal information. As noted, we do not sell personal data. We will not discriminate against you for exercising any of your privacy rights (for example, we won't deny you services or provide a different quality of service because you made a privacy request).
            </p>
            
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong className="text-white">Exercising Your Rights:</strong> If you wish to exercise any of these rights, please contact us using the information in the Contact Information section below. We will respond to your request within a reasonable timeframe as required by law. To protect your privacy, we may take steps to verify your identity before fulfilling your request – for example, by asking you to confirm ownership of the email associated with your account or other identifying information. Please note that some requests may be limited by legal exceptions; if we cannot comply with a request, we will provide an explanation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              AltPage.ai integrates with, or contains links to, certain third-party services to enhance your experience. This Privacy Policy applies only to our own practices, so if you leave our site or connect to a third-party service, please be aware that the third party's terms will apply to your data as well. Key third-party services we use or offer integration with include:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Google Search Console</h3>
                <p className="text-gray-300 leading-relaxed">
                  Our platform can connect to Google Search Console to import your website's SEO performance data (such as indexing status and search analytics). This integration is entirely optional and happens only if you explicitly authenticate with your Google account. The data retrieved from Google is used within AltPage.ai to provide you with detailed SEO insights and reports. We comply with Google's API Terms and data usage policies when accessing your data, and you can revoke AltPage.ai's access via your Google account settings at any time.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Payment Processors</h3>
                <p className="text-gray-300 leading-relaxed">
                  For handling payments and subscriptions securely, we rely on reputable third-party payment processors (for example, Stripe, PayPal, or similar services). If you make a purchase, your credit card and other billing information is provided directly to the payment processor; we do not receive or store your full credit card details. These payment providers are responsible for processing your payment information under their own privacy policies. We only receive minimal information in return (such as a confirmation that payment was completed, last four digits of your card for reference, or payment tokens) so that we can manage your subscription and billing history.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Analytics Providers</h3>
                <p className="text-gray-300 leading-relaxed">
                  We may use third-party analytics tools (such as Google Analytics or privacy-focused alternatives) to collect aggregated information about how users find and use our website. These tools may use cookies or similar technologies (as described in the Cookies section) to gather usage data. This helps us understand traffic patterns and user behavior on our site, enabling us to improve performance and features. The information shared with analytics providers does not include personally identifying details like your name or email, but may include IP address and activity data. Analytics providers have their own privacy commitments; for example, Google provides information on how it uses data from partner sites.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Cloud Hosting and Service Infrastructure</h3>
                <p className="text-gray-300 leading-relaxed">
                  AltPage.ai runs on third-party cloud platforms (for example, Amazon Web Services or Google Cloud) for hosting our application and storing data. These providers store data on our behalf in secure facilities. We remain the controller of your data, and the cloud providers act as processors, meaning they only access data as needed to maintain our service infrastructure.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Other Links and Integrations</h3>
                <p className="text-gray-300 leading-relaxed">
                  Our website may contain links to other sites or services that we do not operate (for example, a link to our community on Discord or a tutorial video on YouTube). If you click those links, you will be directed to a third-party site. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services. We encourage you to review the privacy policy of every site you visit or service you use through our platform.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed mt-4">
              Please note that when you use any third-party services through AltPage.ai, the data you provide to those services or that is collected by them is subject to their respective privacy policies. If you have questions about how those third parties handle your data, you should consult their privacy statements. We aim to only partner with or enable integrations with reputable third parties that uphold strong privacy and security standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Like many online services, AltPage.ai uses cookies and similar tracking technologies to provide functionality and analyze usage. This section explains our use of these technologies and your choices:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">What Are Cookies</h3>
                <p className="text-gray-300 leading-relaxed">
                  Cookies are small text files that are placed on your computer or device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Other technologies related to cookies include web beacons (small graphic images in emails or on pages that track if an email is opened or a page is viewed), pixels, and local storage. In this policy, we refer to all these technologies as "cookies."
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">How We Use Cookies</h3>
                <p className="text-gray-300 leading-relaxed mb-2">
                  AltPage.ai uses cookies for several reasons:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong className="text-white">Essential Cookies:</strong> These are necessary for our site and services to operate properly. For example, when you log in to your account, we use session cookies to keep you logged in as you navigate between pages. Essential cookies might also remember your preferences (like language or other settings) so you have a smoother experience.</li>
                  <li><strong className="text-white">Analytics Cookies:</strong> We use cookies to collect data about traffic to our site and how users interact with our platform. For instance, analytics cookies may tell us which pages are visited most often, what search terms brought users to our site, or if users experience errors on certain pages. This information is aggregated and anonymous – it does not identify you personally. It helps us understand what parts of our website are doing well and what could be improved. We may use third-party analytics tools that set their own cookies (as discussed in Third-Party Services above).</li>
                  <li><strong className="text-white">Functionality Cookies:</strong> These cookies enable additional functionality that is not strictly necessary but improves your user experience. For example, a functionality cookie might remember some of your settings or preferences beyond a single session, so you don't have to re-enter information each time.</li>
                  <li><strong className="text-white">Advertising/Tracking Cookies:</strong> (If applicable) At present, AltPage.ai does not host third-party ads and does not use advertising cookies to target you with ads. If this changes in the future, we will update this policy and, if required by law, seek your consent. We may use a Facebook or Google Ads pixel on our marketing site for the limited purpose of measuring the effectiveness of our own advertising campaigns (e.g., to see how many users sign up after clicking an ad), but such tracking will not involve selling your data and would be used only for our internal analysis and ad optimization.</li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Your Choices</h3>
                <p className="text-gray-300 leading-relaxed">
                  When you first visit our website, you may see a notification about cookies, especially if required by your jurisdiction (for example, users in the EU will see a cookie consent banner). You can choose to accept or decline non-essential cookies. Regardless of that, you always have control through your browser settings. Most web browsers allow you to refuse new cookies, delete existing cookies, or alert you when new cookies are being set. Please note that if you disable or delete cookies, some features of AltPage.ai might not function properly – for instance, you may not be able to stay logged in or some preferences might not be saved.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Do Not Track</h3>
                <p className="text-gray-300 leading-relaxed">
                  Some browsers have a "Do Not Track" feature that lets you tell websites you do not want to be tracked. Currently, our site does not respond to Do Not Track signals, because there is no common standard adopted by industry as to how to interpret such signals. We continue to monitor developments around Do Not Track and may reconsider our approach if a uniform standard emerges.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Analytics Opt-Out</h3>
                <p className="text-gray-300 leading-relaxed">
                  For analytics cookies set by Google Analytics, Google provides an opt-out mechanism via a browser add-on if you wish to prevent your data from being used by Google Analytics across all websites.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              AltPage.ai is not directed to children, and we do not knowingly collect personal information from individuals under the age of 13 (or under the age of 16 in the European Union, where additional protections apply to minors). Our services are intended for businesses and adults. If you are under 13, do not use AltPage.ai or provide any personal data to us.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              If we become aware that we have inadvertently collected personal information from a child under 13, we will take prompt steps to delete that information from our records. If you are a parent or guardian and you believe your child has provided personal information to us without your consent, please contact us immediately (see Contact Information below). We will work to remove the child's information and terminate any account if applicable.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We recommend that parents and guardians educate their children about online safety and privacy. There are parental control tools available that can help provide a child-friendly online environment. AltPage.ai does not knowingly allow minors to use our service, and by using our platform, you represent that you are at least 13 years old (and of legal age to form a binding contract in your jurisdiction).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or for other operational reasons. When we make changes, we will revise the "Effective Date" at the top of this policy. For significant changes, we will provide a more prominent notice, such as a banner on our website or an email notification, to inform you of the update.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. If you continue to use AltPage.ai after a Privacy Policy update, it signifies your acceptance of the revised policy. However, if the changes materially affect how we handle previously collected personal data, we will seek your consent where required by applicable law.
            </p>
            <p className="text-gray-300 leading-relaxed">
              In summary, we will not reduce your rights under this Privacy Policy without your explicit consent. Any changes we make will be in compliance with relevant privacy laws and will aim to maintain our transparency about our data practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Contact Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or how AltPage.ai handles your data, please contact us. We are here to help and will respond as promptly as possible.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Contact us at: <a href="mailto:admin@intelick.com" className="text-cyan-400 hover:text-cyan-300 underline">admin@intelick.com</a> (Email)
            </p>
            <p className="text-gray-300 leading-relaxed">
              By using AltPage.ai, you acknowledge that you have read and understood this Privacy Policy. Protecting your privacy is important to us, and we value the trust you place in AltPage.ai to handle your information responsibly. If you need further clarification about any aspect of this policy, do not hesitate to reach out using the contact information above.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}