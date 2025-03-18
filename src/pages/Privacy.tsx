
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
              At PharmaLens, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            
            <h2>1. Information We Collect</h2>
            <p>
              We may collect information in the following ways:
            </p>
            <ul>
              <li><strong>Information you provide:</strong> When you use our service, you may provide information such as your name, email address, and the images of medications you upload for identification.</li>
              <li><strong>Usage information:</strong> We collect information about how you use our website, including your search queries and interaction with features.</li>
              <li><strong>Device information:</strong> We may collect information about the device you use to access our service, including IP address, browser type, and operating system.</li>
            </ul>
            
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and analyze medication images for identification</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage and trends</li>
              <li>Enhance the safety and security of our services</li>
              <li>Communicate with you about our services</li>
            </ul>
            
            <h2>3. Image Data and Privacy</h2>
            <p>
              When you upload images of medications for identification:
            </p>
            <ul>
              <li>Images are processed by our AI system for the purpose of identification only</li>
              <li>We do not permanently store your medication images after processing is complete</li>
              <li>We do not use your images for any purpose other than providing the identification service</li>
              <li>We do not share your images with third parties except as required to process your request</li>
            </ul>
            
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>
            
            <h2>5. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of any third-party sites you visit.
            </p>
            
            <h2>6. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul>
              <li>The right to access the personal information we hold about you</li>
              <li>The right to request correction or deletion of your personal information</li>
              <li>The right to restrict or object to our processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>
            
            <h2>7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
            
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at himanshusharma.shriram@gmail.com.
            </p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
