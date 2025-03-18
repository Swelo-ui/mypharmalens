
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Disclaimer = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Medical Disclaimer</h1>
          
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              PharmaLens is an informational tool only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </AlertDescription>
          </Alert>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              The information provided by PharmaLens is for general informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or medication.
            </p>
            
            <h2>Not Medical Advice</h2>
            <p>
              PharmaLens does not provide medical advice. The content available through our service, including but not limited to text, graphics, images, and information obtained from PharmaLens's licensors, is for informational purposes only.
            </p>
            
            <h2>No Doctor-Patient Relationship</h2>
            <p>
              Using PharmaLens does not create a doctor-patient relationship. The information provided by PharmaLens should not be used for diagnosing or treating a health problem or disease. It is not a substitute for professional care.
            </p>
            
            <h2>Medication Identification</h2>
            <p>
              While we strive for accuracy in our AI-powered medication identification system, it is not infallible. The identification of medications is based on visual analysis and pattern matching, which may not always be 100% accurate. Always verify any medication identification with a healthcare professional or pharmacist before consumption.
            </p>
            
            <h2>Emergency Situations</h2>
            <p>
              If you think you may have a medical emergency, call your doctor or emergency services immediately. Do not rely on PharmaLens for emergency medical needs.
            </p>
            
            <h2>No Endorsement</h2>
            <p>
              PharmaLens does not endorse any specific medications, treatments, or procedures mentioned on our platform. References to specific medications, products, or services do not constitute or imply recommendation or endorsement.
            </p>
            
            <h2>External Links</h2>
            <p>
              PharmaLens may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy or reliability of information on these external sites.
            </p>
            
            <h2>Consult Healthcare Professionals</h2>
            <p>
              Before making any decisions regarding your health or medication, we strongly recommend consulting with qualified healthcare professionals who are familiar with your individual medical history and needs.
            </p>
            
            <h2>Limitation of Liability</h2>
            <p>
              By using PharmaLens, you agree that PharmaLens and its creators shall not be liable for any direct, indirect, incidental, consequential, or exemplary damages resulting from your use of the service or any information provided by the service.
            </p>
            
            <p className="font-semibold mt-8">
              Remember: Always consult with a qualified healthcare professional before starting, stopping, or changing any treatment or medication.
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

export default Disclaimer;
