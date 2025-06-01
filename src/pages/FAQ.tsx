
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
                Currently, PharmaLens requires an internet connection to access our AI models and medication database. We are exploring options for limited offline functionality in future updates.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>How can I report an incorrect identification?</AccordionTrigger>
              <AccordionContent>
                If you believe our system has misidentified a medication, please use the feedback button on the results page or contact us through our Help Center. Your feedback helps us improve our AI models and database accuracy.
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
