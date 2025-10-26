
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
            
            <h2>3. Age Restrictions and Eligibility</h2>
            <p>
              PharmaLens is intended for users who are at least 13 years of age. If you are under 18 years of age, you must have your parent or legal guardian's permission to use this service. By using PharmaLens, you represent and warrant that you meet these age requirements.
            </p>
            <p>
              If we learn that we have collected personal information from a child under 13 without parental consent, we will delete that information as quickly as possible. If you believe that a child under 13 may have provided us personal information, please contact us immediately.
            </p>

            <h2>4. User Rights</h2>
            <p>
              As a user of PharmaLens, you have the following rights:
            </p>
            <ul>
              <li><strong>Access:</strong> You may access and review any personal information we have collected about you</li>
              <li><strong>Correction:</strong> You may request correction of inaccurate personal information</li>
              <li><strong>Deletion:</strong> You may request deletion of your account and associated data at any time</li>
              <li><strong>Data Portability:</strong> You may request a copy of your data in a structured, machine-readable format</li>
              <li><strong>Opt-out:</strong> You may opt-out of data collection by uninstalling the application</li>
              <li><strong>Service Access:</strong> You have the right to use our service in accordance with these Terms</li>
              <li><strong>Support:</strong> You have the right to contact us for technical support and assistance</li>
            </ul>

            <h2>5. User Responsibilities</h2>
            <p>
              When using PharmaLens, you agree to:
            </p>
            <ul>
              <li>Provide accurate information when using our services</li>
              <li>Use the service only for lawful purposes and in accordance with these Terms</li>
              <li>Respect the intellectual property rights of PharmaLens and third parties</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not attempt to interfere with or disrupt the service or servers</li>
              <li>Not upload or transmit any viruses, malware, or other harmful code</li>
              <li>Maintain the security of your account credentials (if applicable)</li>
              <li>Report any security vulnerabilities or bugs you discover</li>
              <li>Use the service responsibly and not abuse our resources</li>
            </ul>

            <h2>6. Prohibited Activities</h2>
            <p>
              You are expressly prohibited from engaging in any of the following activities:
            </p>
            <ul>
              <li><strong>Medical Misuse:</strong> Using medication identification results as a substitute for professional medical advice or diagnosis</li>
              <li><strong>Reverse Engineering:</strong> Attempting to reverse engineer, decompile, or disassemble our software or AI models</li>
              <li><strong>Automated Access:</strong> Using bots, scrapers, or automated tools to access our service without permission</li>
              <li><strong>Data Mining:</strong> Systematically extracting data from our service for commercial purposes</li>
              <li><strong>Account Sharing:</strong> Sharing your account credentials with unauthorized third parties</li>
              <li><strong>False Information:</strong> Deliberately providing false or misleading information</li>
              <li><strong>System Interference:</strong> Attempting to gain unauthorized access to our systems or networks</li>
              <li><strong>Harmful Content:</strong> Uploading content that is illegal, harmful, threatening, or violates others' rights</li>
              <li><strong>Commercial Exploitation:</strong> Using our service for unauthorized commercial purposes</li>
              <li><strong>Circumvention:</strong> Attempting to bypass any security measures or access controls</li>
            </ul>
            
            <h2>7. Account Terms</h2>
            <p>
              While PharmaLens can be used without creating an account, users may optionally create accounts for enhanced features:
            </p>
            <ul>
              <li><strong>Account Creation:</strong> Account creation is optional and requires minimal information</li>
              <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials</li>
              <li><strong>Account Suspension:</strong> We reserve the right to suspend accounts that violate these Terms</li>
              <li><strong>Account Termination:</strong> You may delete your account at any time, and we will remove associated data</li>
              <li><strong>Inactive Accounts:</strong> Accounts inactive for extended periods may be subject to deletion</li>
            </ul>

            <h2>8. Service Availability and Maintenance</h2>
            <p>
              We strive to provide reliable service, but cannot guarantee uninterrupted availability:
            </p>
            <ul>
              <li>Services may be temporarily unavailable due to maintenance, updates, or technical issues</li>
              <li>We reserve the right to modify, suspend, or discontinue any part of our service</li>
              <li>We will provide reasonable notice of planned maintenance when possible</li>
              <li>Emergency maintenance may occur without prior notice</li>
              <li>We are not liable for any losses resulting from service interruptions</li>
            </ul>

            <h2>9. Refund Policy</h2>
            <p>
              <strong>Refund - We do not provide any kind of refund due to the nature of our business.</strong>
            </p>
            <p>
              PharmaLens provides digital services including AI-powered medication identification and information access. Given the immediate delivery and consumption of our digital services, and the nature of our business model, we maintain a strict no-refund policy. This policy applies to all services, subscriptions, and any payments made to PharmaLens.
            </p>
            <ul>
              <li><strong>No Refunds:</strong> All payments are final and non-refundable</li>
              <li><strong>Service Nature:</strong> Our digital services are delivered immediately upon access</li>
              <li><strong>Business Model:</strong> The nature of our AI-powered identification service does not permit refunds</li>
              <li><strong>Alternative Resolution:</strong> For service issues, please contact our support team for assistance</li>
              <li><strong>Legal Compliance:</strong> This policy is subject to applicable consumer protection laws in your jurisdiction</li>
            </ul>
            <p>
              If you have concerns about our service quality or experience technical issues, please contact our support team. While we cannot provide refunds, we are committed to resolving service-related problems and ensuring user satisfaction within the bounds of our service capabilities.
            </p>

            <h2>10. Content and Conduct</h2>
            <p>
              While PharmaLens primarily processes medication images for identification, users must adhere to content guidelines:
            </p>
            <ul>
              <li>Only upload clear, legitimate medication images for identification purposes</li>
              <li>Do not upload inappropriate, illegal, or harmful content</li>
              <li>Respect community standards and other users</li>
              <li>Report any inappropriate content or behavior</li>
              <li>We reserve the right to remove content that violates these guidelines</li>
            </ul>

            <h2>11. Third-Party Services</h2>
            <p>
              PharmaLens integrates with the following third-party services to provide our functionality:
            </p>
            <ul>
              <li><strong>Supabase:</strong> Provides backend infrastructure and optional user authentication</li>
              <li><strong>Google Gemini AI:</strong> Powers our medication identification and analysis capabilities</li>
            </ul>
            <p>
              Your use of these integrated services is subject to their respective terms of service and privacy policies. We are not responsible for the practices or policies of these third-party services.
            </p>

            <h2>12. Medical Disclaimer and Liability Limitations</h2>
            <p>
              <strong>IMPORTANT MEDICAL DISCLAIMER:</strong> PharmaLens is an informational tool only and is not intended for medical diagnosis, treatment, or emergency situations.
            </p>
            <ul>
              <li><strong>Not Medical Advice:</strong> Information provided is not intended to replace professional medical advice, diagnosis, or treatment</li>
              <li><strong>Consult Healthcare Providers:</strong> Always seek advice from qualified healthcare providers for medical questions</li>
              <li><strong>Emergency Situations:</strong> Do not use PharmaLens for medical emergencies - contact emergency services immediately</li>
              <li><strong>Accuracy Limitations:</strong> While we strive for accuracy, medication identification may not be 100% reliable</li>
              <li><strong>No Medical Liability:</strong> We disclaim all liability for medical decisions made based on our service</li>
              <li><strong>User Responsibility:</strong> Users are solely responsible for verifying medication information with healthcare professionals</li>
            </ul>
            
            <h2>13. Intellectual Property</h2>
            <p>
              All content, features, and functionality on PharmaLens, including but not limited to text, graphics, logos, icons, images, software, and AI models, are owned by PharmaLens or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <ul>
              <li>You may not copy, modify, distribute, or create derivative works from our content</li>
              <li>You may not reverse engineer or attempt to extract our AI models or algorithms</li>
              <li>Limited use is granted solely for personal, non-commercial use of our service</li>
              <li>All trademarks and service marks are the property of their respective owners</li>
            </ul>
            
            <h2>14. Data Processing and Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. Key points include:
            </p>
            <ul>
              <li>We collect minimal personal information and process images temporarily for identification</li>
              <li>Images are deleted immediately after processing and are not stored</li>
              <li>Account creation is optional and requires minimal information</li>
              <li>We comply with applicable data protection regulations</li>
              <li>You have rights regarding your personal data as outlined in our Privacy Policy</li>
            </ul>
            
            <h2>15. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless PharmaLens, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from:
            </p>
            <ul>
              <li>Your use of and access to the service</li>
              <li>Your violation of any term of these Terms</li>
              <li>Your violation of any third-party right, including intellectual property or privacy rights</li>
              <li>Any claim that your use of the service caused damage to a third party</li>
            </ul>
            
            <h2>16. Limitations of Liability</h2>
            <p>
              To the maximum extent permitted by law, PharmaLens and its affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages resulting from:
            </p>
            <ul>
              <li>Your use or inability to use the service</li>
              <li>Any unauthorized access to or use of our servers and/or personal information</li>
              <li>Any interruption or cessation of transmission to or from our service</li>
              <li>Any bugs, viruses, or similar harmful components transmitted through the service</li>
              <li>Any errors or omissions in content or for any loss or damage incurred from use of content</li>
              <li>Medical decisions made based on information from our service</li>
            </ul>
            
            <h2>17. Dispute Resolution</h2>
            <p>
              Any disputes arising out of or relating to these Terms or the use of PharmaLens shall be resolved as follows:
            </p>
            <ul>
              <li><strong>Informal Resolution:</strong> We encourage you to contact us first to resolve any disputes informally</li>
              <li><strong>Mediation:</strong> If informal resolution fails, disputes may be submitted to mediation</li>
              <li><strong>Arbitration:</strong> Any unresolved disputes shall be settled by binding arbitration in accordance with the laws of India</li>
              <li><strong>Class Action Waiver:</strong> You agree not to participate in class action lawsuits against PharmaLens</li>
              <li><strong>Jurisdiction:</strong> Any legal proceedings shall be conducted in the courts of India</li>
            </ul>
            
            <h2>18. Termination</h2>
            <p>
              These Terms remain in effect until terminated by either you or PharmaLens:
            </p>
            <ul>
              <li><strong>Termination by You:</strong> You may stop using our service at any time</li>
              <li><strong>Termination by Us:</strong> We may terminate your access for violations of these Terms</li>
              <li><strong>Effect of Termination:</strong> Upon termination, your right to use the service ceases immediately</li>
              <li><strong>Data Deletion:</strong> We will delete your account data upon termination as outlined in our Privacy Policy</li>
              <li><strong>Survival:</strong> Sections regarding liability, indemnification, and dispute resolution survive termination</li>
            </ul>
            
            <h2>19. Updates and Notifications</h2>
            <p>
              We will notify users of significant changes to these Terms through:
            </p>
            <ul>
              <li>Prominent notice on our website or application</li>
              <li>Email notification to registered users (if applicable)</li>
              <li>In-app notifications for mobile users</li>
              <li>Updates will be effective 30 days after notification unless otherwise specified</li>
              <li>Continued use after the effective date constitutes acceptance of new Terms</li>
            </ul>
            
            <h2>20. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.
            </p>
            
            <h2>21. Governing Law and Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts of India, and you hereby consent to personal jurisdiction and venue therein.
            </p>
            
            <h2>22. Contact Information</h2>
            <p>
              If you have any questions about these Terms, need support, or wish to report violations, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> himanshusharma.shriram@gmail.com</li>
              <li><strong>Response Time:</strong> We aim to respond to all inquiries within 48 hours</li>
              <li><strong>Urgent Matters:</strong> For urgent legal or security matters, please mark your email as "URGENT"</li>
              <li><strong>Business Hours:</strong> Monday to Friday, 9:00 AM to 6:00 PM IST</li>
            </ul>
            
            <h2>23. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and PharmaLens regarding the use of our service and supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the service.
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
