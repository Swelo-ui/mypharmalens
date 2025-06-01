
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Terms of Use - PharmaLens"
        description="Read PharmaLens Terms of Use and service conditions. Understand user responsibilities, medical disclaimers, privacy policies, and legal information for our medication identification platform."
        keywords="PharmaLens terms of use, terms and conditions, service agreement, medical disclaimer, user responsibilities, legal information"
        canonicalUrl="/terms"
        noIndex={false}
      />
      
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              Welcome to PharmaLens. These Terms of Use govern your use of our website and services. By accessing or using PharmaLens, you agree to be bound by these Terms.
            </p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using PharmaLens, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree with these Terms, please do not use our service.
            </p>
            
            <h2>2. Description of Service</h2>
            <p>
              PharmaLens provides an AI-powered medication identification and information platform. Our service is designed to help users identify medications and access information about them, but it is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            
            <h2>3. User Responsibilities</h2>
            <p>
              When using PharmaLens, you agree to:
            </p>
            <ul>
              <li>Provide accurate information when using our services</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not attempt to interfere with or disrupt the service or servers</li>
              <li>Not upload or transmit any viruses, malware, or other harmful code</li>
            </ul>
            
            <h2>4. Medical Disclaimer</h2>
            <p>
              PharmaLens is an informational tool only. The information provided through our service is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition or medication.
            </p>
            
            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality on PharmaLens, including but not limited to text, graphics, logos, icons, images, and software, are owned by PharmaLens or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <h2>6. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>
            
            <h2>7. Limitations of Liability</h2>
            <p>
              To the maximum extent permitted by law, PharmaLens and its affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages resulting from your use or inability to use the service.
            </p>
            
            <h2>8. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting. Your continued use of PharmaLens after any such changes constitutes your acceptance of the new Terms.
            </p>
            
            <h2>9. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
            
            <h2>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at himanshusharma.shriram@gmail.com.
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

export default Terms;
