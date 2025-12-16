
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              At PharmaLens, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our medication identification application.
            </p>

            <h2>1. Developer Information</h2>
            <p>
              <strong>App Name:</strong> PharmaLens<br />
              <strong>Developer:</strong> Himanshu Sharma<br />
              <strong>Contact Email:</strong> himanshusharma.shriram@gmail.com<br />
              <strong>App Purpose:</strong> AI-powered medication identification and drug information lookup
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Camera and Image Data</h3>
            <ul>
              <li><strong>Camera Access:</strong> We request camera permission to allow you to take photos of medications for identification purposes</li>
              <li><strong>Image Processing:</strong> Images are processed temporarily by our AI system for medication identification only</li>
              <li><strong>No Permanent Storage:</strong> Uploaded images are not permanently stored on our servers and are deleted after processing</li>
            </ul>

            <h3>2.2 Device Information</h3>
            <ul>
              <li><strong>Device Type:</strong> Information about your device model and operating system for app functionality</li>
              <li><strong>App Performance:</strong> Basic usage data to ensure the app functions properly</li>
              <li><strong>No Personal Identifiers:</strong> We do not collect device IDs or other unique identifiers</li>
            </ul>

            <h3>2.3 Optional Account Information</h3>
            <ul>
              <li><strong>Email Address:</strong> Only if you choose to create an account for saving search history</li>
              <li><strong>Search History:</strong> Medication searches are saved only if you create an account and opt-in</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use collected information solely for:</p>
            <ul>
              <li>Processing medication images for identification</li>
              <li>Providing drug information and safety details</li>
              <li>Maintaining app functionality and performance</li>
              <li>Responding to user support requests</li>
            </ul>

            <h2>4. Data Retention and Deletion</h2>
            <ul>
              <li><strong>Images:</strong> Deleted immediately after processing (within minutes)</li>
              <li><strong>Search History:</strong> Retained only if you create an account; can be deleted anytime</li>
              <li><strong>Account Data:</strong> Deleted within 30 days of account deletion request</li>
              <li><strong>Device Data:</strong> Not stored permanently; used only during app session</li>
            </ul>

            <h2>5. Third-Party Services and Data Sharing</h2>
            <h3>5.1 Third-Party Services We Use</h3>
            <p>PharmaLens uses the following third-party services:</p>
            <ul>
              <li><strong>Supabase:</strong> Secure database hosting for optional account features and app backend</li>
              <li><strong>Google Gemini AI:</strong> For processing medication images (images are not stored by Google)</li>
              <li><strong>Google Analytics:</strong> For understanding app usage patterns and improving our service (see section 5.5 below)</li>
              <li><strong>Razorpay:</strong> For secure payment processing (payment data handled by Razorpay only)</li>
            </ul>

            <h3>5.2 Aggregated and Anonymous Data</h3>
            <p>We may collect and use aggregated, anonymized data to improve our service, including:</p>
            <ul>
              <li>General usage patterns (without personal identifiers)</li>
              <li>App performance metrics</li>
              <li>Error reporting for bug fixes</li>
            </ul>
            <p>This data cannot be used to identify individual users and helps us enhance the app experience.</p>

            <h3>5.3 When We May Share Information</h3>
            <p>We may disclose your information only in the following limited circumstances:</p>
            <ul>
              <li><strong>Legal Requirements:</strong> As required by law, such as to comply with a subpoena or similar legal process</li>
              <li><strong>Safety and Protection:</strong> When we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request</li>
              <li><strong>Trusted Service Providers:</strong> With our trusted service providers (Supabase, Google) who work on our behalf, do not have independent use of the information we disclose to them, and have agreed to adhere to strict privacy and security standards</li>
            </ul>

            <h3>5.4 Marketing Communications</h3>
            <p>
              <strong>Important:</strong> PharmaLens does not send marketing promotions or advertising emails. We only send essential communications related to:
            </p>
            <ul>
              <li>Account security notifications</li>
              <li>Important app updates or changes</li>
              <li>Responses to your support requests</li>
              <li>Critical safety information</li>
            </ul>

            <h3>5.5 Google Analytics</h3>
            <p>
              PharmaLens uses Google Analytics to understand how users interact with our app and to improve our services. Google Analytics collects:
            </p>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, session duration, and navigation patterns</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and screen resolution</li>
              <li><strong>Location Data:</strong> Approximate geographic location based on IP address (country/city level only)</li>
              <li><strong>Performance Data:</strong> Page load times, errors, and app performance metrics</li>
            </ul>
            <p>
              <strong>Important:</strong> Google Analytics does NOT collect:
            </p>
            <ul>
              <li>Personal health information or medication searches</li>
              <li>Images you upload for identification</li>
              <li>Your name, email, or other personal identifiers</li>
              <li>Payment or financial information</li>
            </ul>
            <p>
              You can opt-out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Analytics Opt-out Browser Add-on</a> or by enabling "Do Not Track" in your browser settings.
            </p>

            <h3>5.6 Offline Data Storage</h3>
            <p>
              PharmaLens offers an optional offline data download feature that stores medication database information locally on your device:
            </p>
            <ul>
              <li><strong>Storage Location:</strong> Data is stored in your browser's IndexedDB, which is local to your device only</li>
              <li><strong>Data Stored:</strong> Medication names, dosages, side effects, and general drug information (no personal data)</li>
              <li><strong>Data Size:</strong> Approximately 2MB compressed</li>
              <li><strong>Your Control:</strong> You can delete this data at any time from the Profile settings</li>
              <li><strong>No Transmission:</strong> Offline data is never sent to our servers or third parties</li>
            </ul>

            <h2>6. Your Rights and Choices</h2>
            <h3>6.1 Data Access and Control</h3>
            <ul>
              <li><strong>Access:</strong> Request information about data we have collected</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Portability:</strong> Request export of your search history data</li>
            </ul>

            <h3>6.2 Camera Permissions</h3>
            <ul>
              <li>You can revoke camera access at any time through device settings</li>
              <li>The app will still function for manual drug searches without camera access</li>
            </ul>

            <h3>6.3 Opt-Out Rights</h3>
            <p>You have the following options to control or stop data collection:</p>
            <ul>
              <li><strong>Complete Opt-Out:</strong> You can stop all collection of information by uninstalling the PharmaLens app</li>
              <li><strong>Uninstall Process:</strong> Use the standard uninstall processes available on your mobile device or via the app store</li>
              <li><strong>Data Deletion:</strong> Upon uninstalling, all locally stored data is immediately removed from your device</li>
              <li><strong>Account Data:</strong> If you have an account, contact us to request deletion of server-stored data</li>
              <li><strong>Camera Access:</strong> Disable camera permissions in device settings to prevent image capture</li>
            </ul>

            <h2>7. Age Restrictions</h2>
            <p>
              PharmaLens is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>

            <h2>8. Data Security</h2>
            <ul>
              <li>All data transmission is encrypted using industry-standard protocols</li>
              <li>Images are processed securely and deleted immediately</li>
              <li>Account data is stored with enterprise-grade security measures</li>
              <li>We regularly review and update our security practices</li>
            </ul>

            <h2>9. International Data Transfers</h2>
            <p>
              Your data may be processed in servers located outside your country. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>

            <h2>10. Legal Compliance</h2>
            <h3>10.1 GDPR Compliance (EU Users)</h3>
            <p>If you are in the European Union, you have additional rights under GDPR including the right to object to processing and the right to lodge a complaint with supervisory authorities.</p>

            <h3>10.2 CCPA Compliance (California Users)</h3>
            <p>California residents have the right to know what personal information is collected, request deletion, and opt-out of sale (note: we do not sell personal information).</p>

            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify users of significant changes through the app or email (if you have an account). Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              For privacy-related questions, data requests, or concerns, contact us at:
            </p>
            <ul>
              <li><strong>Email:</strong> himanshusharma.shriram@gmail.com</li>
              <li><strong>Subject Line:</strong> "Privacy Request - PharmaLens"</li>
              <li><strong>Response Time:</strong> We will respond within 30 days for general inquiries</li>
              <li><strong>Urgent Requests:</strong> Data deletion and security concerns will be addressed within 72 hours</li>
              <li><strong>Business Hours:</strong> Monday-Friday, 9 AM - 6 PM IST</li>
            </ul>

            <h3>12.1 Data Request Process</h3>
            <p>When contacting us for data-related requests, please include:</p>
            <ul>
              <li>Your full name and email address associated with your account (if applicable)</li>
              <li>Specific nature of your request (access, deletion, correction, etc.)</li>
              <li>Any relevant details to help us locate your information</li>
            </ul>
            <p>We may require identity verification before processing certain requests to protect your privacy and security.</p>

            <h2>13. Medical Disclaimer</h2>
            <p>
              PharmaLens is for informational purposes only and should not replace professional medical advice. Always consult healthcare professionals for medical decisions.
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 border-t pt-4">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
              <strong>Version:</strong> 2.0<br />
              <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
