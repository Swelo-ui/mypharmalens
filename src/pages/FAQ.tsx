
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How accurate is the medication identification?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PharmaLens uses advanced AI models trained on large datasets of medication images. Our system can identify most standard medications with high accuracy, even from somewhat blurry images."
        }
      },
      {
        "@type": "Question",
        "name": "Where does PharmaLens get its medication information?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We source our medication data from trusted pharmaceutical databases, including Drugs.com and national drug formularies. All information is regularly verified and updated to ensure accuracy."
        }
      },
      {
        "@type": "Question",
        "name": "Can PharmaLens be used for medical advice?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, PharmaLens is an information tool only and should not be used as a substitute for professional medical advice. Always consult with a qualified healthcare provider."
        }
      },
      {
        "@type": "Question",
        "name": "How does the Symptoms Checker work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our Symptoms Checker uses AI to analyze your symptoms and provide personalized medication recommendations. Select your symptoms from organized categories, and our system will suggest appropriate first-line treatments based on evidence-based medical guidelines."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Drug Interaction Checker and why is it important?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Drug Interaction Checker is a safety tool that analyzes potential risks when combining medications. It can detect dangerous interactions that could cause serious side effects, reduce medication effectiveness, or require special monitoring."
        }
      },
      {
        "@type": "Question",
        "name": "What subscription plans are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PharmaLens offers three plans: Free (₹0/month, 5 AI identifications), Lite (₹49/month, 39 AI identifications), and Pro (₹99/month, 101 AI identifications) with varying features including advanced search, database access, and premium tools."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use PharmaLens offline?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! PharmaLens offers an offline data download feature. You can download our complete medication database (~2MB) to your device and search for medicines even without internet. The data is stored locally in your browser and can be updated whenever you're online. Note that AI image identification still requires an internet connection."
        }
      },
      {
        "@type": "Question",
        "name": "Does PharmaLens use analytics or tracking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we use Google Analytics to understand how users interact with our app and to improve our services. We only collect anonymous usage data like page views and feature usage. We do NOT track your medication searches, health data, or personal information. You can opt-out anytime using browser privacy settings or the Google Analytics opt-out extension."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Frequently Asked Questions - PharmaLens"
        description="Get answers to common questions about PharmaLens medication identification, accuracy, data sources, privacy, and usage. Learn how our AI-powered drug identification works."
        keywords="PharmaLens FAQ, medication identification questions, pill identifier help, drug database questions, AI medication accuracy, pharmaceutical app support"
        canonicalUrl="/faq"
        structuredData={structuredData}
      />

      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How accurate is the medication identification?</AccordionTrigger>
              <AccordionContent>
                PharmaLens uses advanced AI models trained on large datasets of medication images. Our system can identify most standard medications with high accuracy, even from somewhat blurry images. However, accuracy may vary based on image quality, lighting, and whether the medication is common or rare.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Where does PharmaLens get its medication information?</AccordionTrigger>
              <AccordionContent>
                We source our medication data from trusted pharmaceutical databases, including Drugs.com and national drug formularies. All information is regularly verified and updated to ensure accuracy. Our database covers thousands of medications from around the world.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can PharmaLens be used for medical advice?</AccordionTrigger>
              <AccordionContent>
                No, PharmaLens is an information tool only and should not be used as a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis, treatment recommendations, and answers to your personal medical questions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How do I take a good photo for identification?</AccordionTrigger>
              <AccordionContent>
                For best results, take photos in good lighting, place the medication against a plain background, and ensure that any markings, imprints, or colors are visible. Our AI can work with less-than-perfect images, but clearer photos will yield more accurate results.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Is my data secure when I upload medication images?</AccordionTrigger>
              <AccordionContent>
                Yes, we take data privacy seriously. Images you upload are used only for the purpose of identification and are not stored permanently. We do not collect or use personal health information, and all data transmission is encrypted using industry-standard security protocols.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Can I use PharmaLens offline?</AccordionTrigger>
              <AccordionContent>
                Yes! PharmaLens now offers an offline data download feature. From your Profile settings, you can download our complete medication database (~2MB) which includes information on 1200+ medicines. Once downloaded, you can search for medicines and view their details even without an internet connection. The data is stored securely in your browser's local storage. Note that AI image identification and some advanced features still require an internet connection.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6b">
              <AccordionTrigger>How do I download offline data?</AccordionTrigger>
              <AccordionContent>
                To download offline data: 1) Log in to your account, 2) Go to your Profile page, 3) Scroll to the "Offline Data" section, 4) Click "Download All Medicines". The download takes about 30 seconds depending on your internet speed. You can check for updates anytime and delete the data if needed to free up storage space.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>How can I report an incorrect identification?</AccordionTrigger>
              <AccordionContent>
                If you believe our system has misidentified a medication, please use the feedback button on the results page or contact us through our Help Center. Your feedback helps us improve our AI models and database accuracy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How does the Symptoms Checker work?</AccordionTrigger>
              <AccordionContent>
                Our Symptoms Checker uses AI to analyze your symptoms and provide personalized medication recommendations. Select your symptoms from organized categories (Headache, Fever, Digestive, etc.), and our system will suggest appropriate first-line treatments based on evidence-based medical guidelines. The recommendations include both brand and generic names with clear explanations in layman terms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>What is the Drug Interaction Checker and why is it important?</AccordionTrigger>
              <AccordionContent>
                The Drug Interaction Checker is a safety tool that analyzes potential risks when combining medications. It can detect dangerous interactions that could cause serious side effects, reduce medication effectiveness, or require special monitoring. The tool provides information about onset timing, severity levels, and what actions to take. You can toggle between simple terms and medical terminology for better understanding.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>What subscription plans are available?</AccordionTrigger>
              <AccordionContent>
                PharmaLens offers three plans: Free (₹0/month) with 100 drugs database search and 5 AI identifications; Lite (₹49/month, save ₹30) with 39 AI identifications and 1200+ medicines database with advanced search (249 results); Pro (₹99/month, save ₹100) with 101 AI identifications, 1200+ medicines database, advanced search (500 results), layman explanations, history feature, and advanced search filters. All plans include mobile web app access, PWA offline access, and basic drug information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>Is PharmaLens available as a mobile app?</AccordionTrigger>
              <AccordionContent>
                Currently, PharmaLens is available as a mobile-optimized web application that works seamlessly on all devices including smartphones, tablets, and desktops. You can access all features through your mobile browser with a native app-like experience. We are exploring native mobile app development for future releases.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger>How accurate is the AI identification system?</AccordionTrigger>
              <AccordionContent>
                Our AI identification system maintains a 99.5% accuracy rate across our database of 1000+ medications. The system is trained on large datasets of medication images and continuously improved based on user feedback. Accuracy depends on image quality, lighting conditions, and whether the medication is in our database. For best results, follow our photography guidelines.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger>Can I use PharmaLens for emergency situations?</AccordionTrigger>
              <AccordionContent>
                While PharmaLens provides quick medication identification and safety information, it should NOT be used as the primary tool in medical emergencies. For poisoning, overdose, or serious adverse reactions, immediately contact emergency services (911/108) or poison control. PharmaLens is designed for educational purposes and routine medication management, not emergency medical care.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14">
              <AccordionTrigger>How do I access my identification history?</AccordionTrigger>
              <AccordionContent>
                The identification history feature is available for Pro subscribers (₹99/month). Once subscribed, all your medication identifications and searches are automatically saved in your account. You can access your history from the main menu, view past results, and quickly re-access previously identified medications. This feature helps track your medication queries over time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15">
              <AccordionTrigger>What payment methods are supported?</AccordionTrigger>
              <AccordionContent>
                PharmaLens supports secure payments through PhonePe, India's leading digital payment platform. You can pay using UPI, debit/credit cards, net banking, and digital wallets. All transactions are processed securely with 256-bit SSL encryption. Payment confirmations are instant, and your subscription activates immediately upon successful payment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-16">
              <AccordionTrigger>How often is the medication database updated?</AccordionTrigger>
              <AccordionContent>
                Our medication database is updated continuously with new medications, safety information, and drug interactions. We source data from trusted pharmaceutical databases including Drugs.com and national drug formularies. Updates include new drug approvals, safety alerts, recall information, and revised dosing guidelines. Pro plan users get priority access to the latest database updates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-17">
              <AccordionTrigger>Can healthcare professionals use PharmaLens?</AccordionTrigger>
              <AccordionContent>
                Yes, PharmaLens is designed for both consumers and healthcare professionals. Medical professionals can use it as a quick reference tool for medication identification, interaction checking, and patient education. The platform provides both layman terms and medical terminology, making it suitable for explaining medications to patients. However, it should complement, not replace, professional medical judgment and established clinical protocols.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-18">
              <AccordionTrigger>Does PharmaLens track my usage or data?</AccordionTrigger>
              <AccordionContent>
                PharmaLens uses Google Analytics to understand general app usage patterns and improve our services. This includes anonymous data like page views, feature usage, and device information. Importantly, we do NOT track your medication searches, health information, or personal data. The analytics help us understand which features are most useful and where we can improve. You can opt-out of analytics anytime using browser privacy settings or the Google Analytics opt-out browser extension.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-19">
              <AccordionTrigger>Where is my offline data stored?</AccordionTrigger>
              <AccordionContent>
                When you download offline data, it's stored locally in your browser's IndexedDB storage on your device only. This data never leaves your device and is not synced to any servers. The storage is persistent, meaning it remains even when you close the browser. You have full control to view the storage size and delete the data anytime from the Profile settings. Clearing your browser data will also remove the offline database.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
