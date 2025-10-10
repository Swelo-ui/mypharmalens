
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Disclaimer = () => {
  return (
    <>
      <SEOHead 
        title="Medical Disclaimer - PharmaLens"
        description="Important medical disclaimers and legal information for PharmaLens AI medication identification app. Not a substitute for professional medical advice."
        keywords="medical disclaimer, medication identification, AI limitations, healthcare advice, pharmaceutical information"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Medical Disclaimer</h1>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-8">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">⚠️ Critical Medical Notice</h3>
              <p className="text-red-700 dark:text-red-300 font-medium">
                PharmaLens is an AI-powered informational tool only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult healthcare professionals for medical decisions.
              </p>
            </div>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>1. Developer Information</h2>
              <p>
                PharmaLens is developed by Himanshu Sharma. For technical support or inquiries, contact us at himanshusharma.shriram@gmail.com. This application is designed for informational purposes only and does not constitute medical practice or professional healthcare services.
              </p>

              <h2>2. Scope of Service</h2>
              <p>
                PharmaLens provides AI-powered medication identification through image analysis and basic drug information lookup. Our service does NOT:
              </p>
              <ul>
                <li>Prescribe medications or provide prescription advice</li>
                <li>Diagnose medical conditions or symptoms</li>
                <li>Recommend dosages or treatment plans</li>
                <li>Replace professional medical consultation</li>
                <li>Provide personalized medical advice</li>
                <li>Monitor drug interactions or contraindications</li>
                <li>Offer emergency medical services</li>
              </ul>

              <h2>3. AI Technology Limitations</h2>
              <p>
                Our AI medication identification system has inherent limitations:
              </p>
              <ul>
                <li><strong>Accuracy:</strong> AI identification is not 100% accurate and may produce false positives or negatives</li>
                <li><strong>Image Quality:</strong> Poor lighting, blurry images, or damaged pills may result in incorrect identification</li>
                <li><strong>Similar Medications:</strong> Pills with similar appearance may be misidentified</li>
                <li><strong>Generic vs. Brand:</strong> The system may not distinguish between generic and brand-name versions</li>
                <li><strong>Compound Medications:</strong> Custom or compounded medications may not be accurately identified</li>
                <li><strong>Training Data:</strong> AI performance is limited by the scope and quality of training data</li>
              </ul>

              <h2>4. User Responsibilities</h2>
              <p>
                By using PharmaLens, you acknowledge and agree to:
              </p>
              <ul>
                <li>Verify all medication identifications with healthcare professionals or pharmacists</li>
                <li>Never consume unidentified medications based solely on AI identification</li>
                <li>Consult healthcare providers before making any medication-related decisions</li>
                <li>Use the app only for informational and educational purposes</li>
                <li>Not rely on the app for emergency medical situations</li>
                <li>Understand that AI identification is a tool, not a medical diagnosis</li>
                <li>Report any suspected errors or inaccuracies to our support team</li>
              </ul>

              <h2>5. Age Restrictions and Parental Guidance</h2>
              <p>
                PharmaLens is intended for users 13 years and older. Users under 18 must have parental supervision when using this app. Parents and guardians should:
              </p>
              <ul>
                <li>Monitor their child's use of medication identification tools</li>
                <li>Ensure children understand the limitations of AI technology</li>
                <li>Supervise any medication-related discussions or decisions</li>
                <li>Consult pediatric healthcare providers for all child medication needs</li>
              </ul>

              <h2>6. Regulatory Compliance</h2>
              <p>
                PharmaLens is not regulated by the FDA, EMA, or other medical device authorities. This app:
              </p>
              <ul>
                <li>Is not a medical device or diagnostic tool</li>
                <li>Has not undergone clinical trials for medical accuracy</li>
                <li>Is not approved for medical or diagnostic use</li>
                <li>Does not meet medical device standards or regulations</li>
                <li>Should not be used in clinical or professional medical settings</li>
              </ul>

              <h2>7. Data Accuracy and Updates</h2>
              <p>
                While we strive to maintain accurate drug information, we cannot guarantee:
              </p>
              <ul>
                <li>Real-time accuracy of pharmaceutical databases</li>
                <li>Completeness of drug information or side effects</li>
                <li>Current availability or market status of medications</li>
                <li>Accuracy of dosage information or administration guidelines</li>
                <li>Up-to-date pricing or insurance coverage information</li>
              </ul>

              <h2>8. Geographic and Regulatory Limitations</h2>
              <p>
                Medication availability, regulations, and information vary by country and region. PharmaLens:
              </p>
              <ul>
                <li>May not reflect local medication availability or regulations</li>
                <li>Cannot account for country-specific drug approvals or restrictions</li>
                <li>May include medications not available in your jurisdiction</li>
                <li>Does not provide region-specific medical advice or guidelines</li>
              </ul>

              <h2>9. Professional Medical Consultation Required</h2>
              <p>
                You MUST consult qualified healthcare professionals for:
              </p>
              <ul>
                <li>All medication identification verification</li>
                <li>Prescription and dosage decisions</li>
                <li>Drug interaction assessments</li>
                <li>Side effect evaluation and management</li>
                <li>Allergy and contraindication screening</li>
                <li>Medical condition diagnosis and treatment</li>
                <li>Emergency medical situations</li>
              </ul>

              <h2>10. Drug Interactions and Contraindications</h2>
              <p>
                PharmaLens does NOT provide comprehensive drug interaction or contraindication analysis. Users must:
              </p>
              <ul>
                <li>Consult pharmacists or physicians for interaction screening</li>
                <li>Disclose all medications, supplements, and medical conditions to healthcare providers</li>
                <li>Never assume medications are safe based on app information alone</li>
                <li>Seek professional advice for all medication combinations</li>
              </ul>

              <h2>11. Allergic Reactions and Emergency Situations</h2>
              <p>
                <strong>EMERGENCY WARNING:</strong> If you experience signs of allergic reaction or adverse drug effects:
              </p>
              <ul>
                <li><strong>Severe reactions:</strong> Call emergency services (911, 112, or local emergency number) immediately</li>
                <li><strong>Symptoms include:</strong> Difficulty breathing, swelling, severe rash, chest pain, or loss of consciousness</li>
                <li><strong>Do not delay:</strong> Seek immediate medical attention for any suspected drug reaction</li>
                <li><strong>Poison control:</strong> Contact poison control centers for suspected overdose or poisoning</li>
              </ul>

              <h2>12. Pregnancy and Nursing Mothers</h2>
              <p>
                <strong>Special Population Warning:</strong> Pregnant and nursing mothers must exercise extreme caution:
              </p>
              <ul>
                <li>Many medications can harm developing babies or pass through breast milk</li>
                <li>Always consult obstetricians, gynecologists, or pediatricians before taking any medication</li>
                <li>Never rely on general drug information for pregnancy or nursing safety</li>
                <li>Teratogenic effects and developmental risks require professional assessment</li>
              </ul>

              <h2>13. Pediatric Use and Child Safety</h2>
              <p>
                <strong>Child Safety Warning:</strong> Medications for children require special considerations:
              </p>
              <ul>
                <li>Pediatric dosing differs significantly from adult dosing</li>
                <li>Many adult medications are dangerous or contraindicated for children</li>
                <li>Always consult pediatricians for any child medication needs</li>
                <li>Keep all medications out of reach of children</li>
                <li>Never give children medications without professional guidance</li>
              </ul>

              <h2>14. Off-Label Use and Prescription Medications</h2>
              <p>
                PharmaLens information may not cover:
              </p>
              <ul>
                <li>Off-label uses of medications (uses not officially approved)</li>
                <li>Compounded or custom-formulated medications</li>
                <li>Experimental or investigational drugs</li>
                <li>Prescription-only medications requiring medical supervision</li>
                <li>Controlled substances with special handling requirements</li>
              </ul>

              <h2>15. Legal and Medical Malpractice Protection</h2>
              <p>
                By using PharmaLens, you acknowledge that:
              </p>
              <ul>
                <li>No doctor-patient relationship is established</li>
                <li>No medical malpractice insurance covers app-provided information</li>
                <li>The app developers are not licensed medical professionals</li>
                <li>Legal liability for medical decisions remains with you and your healthcare providers</li>
                <li>The app cannot be held responsible for medical outcomes or decisions</li>
              </ul>

              <h2>16. Information Updates and Maintenance</h2>
              <p>
                Medical information changes frequently. PharmaLens:
              </p>
              <ul>
                <li>Updates drug databases periodically but not in real-time</li>
                <li>May contain outdated or superseded medical information</li>
                <li>Cannot guarantee immediate updates for drug recalls or safety alerts</li>
                <li>Recommends checking official medical sources for current information</li>
              </ul>

              <h2>17. Third-Party Medical Information Sources</h2>
              <p>
                Our app may reference third-party medical databases and sources. We:
              </p>
              <ul>
                <li>Do not control or verify all third-party medical information</li>
                <li>Cannot guarantee accuracy of external medical databases</li>
                <li>Are not responsible for errors in third-party medical content</li>
                <li>Recommend verifying information through official medical channels</li>
              </ul>

              <h2>18. Emergency Contact Information</h2>
              <p>
                <strong>For Medical Emergencies:</strong>
              </p>
              <ul>
                <li><strong>Emergency Services:</strong> 911 (US), 112 (EU), or your local emergency number</li>
                <li><strong>Poison Control:</strong> 1-800-222-1222 (US) or local poison control center</li>
                <li><strong>Your Healthcare Provider:</strong> Contact your doctor or pharmacist immediately</li>
                <li><strong>Hospital Emergency Room:</strong> Visit the nearest emergency department for severe reactions</li>
              </ul>

              <h2>19. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PharmaLens and its developers SHALL NOT BE LIABLE for any direct, indirect, incidental, consequential, special, or exemplary damages, including but not limited to:
              </p>
              <ul>
                <li>Medical complications or adverse drug reactions</li>
                <li>Misidentification of medications or incorrect drug information</li>
                <li>Delayed or inappropriate medical treatment</li>
                <li>Personal injury, illness, or death</li>
                <li>Medical expenses or healthcare costs</li>
                <li>Loss of income or other economic damages</li>
              </ul>

              <h2>20. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless PharmaLens, its developers, and affiliates from any claims, damages, or expenses arising from your use of the app, including medical decisions made based on app information.
              </p>

              <h2>21. Governing Law and Jurisdiction</h2>
              <p>
                This disclaimer is governed by the laws of India. Any disputes shall be resolved in the courts of India. However, this does not limit your rights under local consumer protection laws.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-8">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">⚠️ CRITICAL REMINDER</h3>
                <p className="text-red-700 dark:text-red-300 font-medium">
                  PharmaLens is a technology tool, NOT a medical professional. NEVER make medical decisions based solely on app information. ALWAYS verify medication identifications and consult healthcare professionals for all medical needs.
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Disclaimer;
