
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

// Define the structure of our help articles
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'visual-identification' | 'searching' | 'results' | 'general' | 'symptoms-checker' | 'drug-interactions';
  createdAt: string;
}

// Mock data for our help articles
export const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'How to identify a pill using PharmaLens',
    content: `
      <h2>How to identify a pill using PharmaLens</h2>
      
      <p>Follow these simple steps to identify medication using PharmaLens:</p>
      
      <ol>
        <li><strong>Open the PharmaLens app</strong> and navigate to the "Identify" section.</li>
        <li><strong>Take a clear photo</strong> of the medication on a plain, well-lit background.</li>
        <li><strong>Center the pill</strong> in the frame and make sure any markings or imprints are visible.</li>
        <li><strong>Submit the image</strong> and wait for the AI to process your request.</li>
        <li><strong>Review the results</strong> which will show potential matches with confidence scores.</li>
      </ol>
      
      <h3>Tips for better identification:</h3>
      
      <ul>
        <li>Use good lighting - natural daylight works best</li>
        <li>Place the pill on a solid, contrasting background</li>
        <li>Take multiple photos from different angles if needed</li>
        <li>Include both sides of the pill if there are markings on both</li>
      </ul>
      
      <p>Remember that PharmaLens is a tool to assist in medication identification, but always consult with a healthcare professional to confirm the identity of any medication before use.</p>
    `,
    category: 'visual-identification',
    createdAt: '2023-10-15'
  },
  {
    id: '2',
    title: 'Understanding medication interactions',
    content: `
      <h2>Understanding medication interactions</h2>
      
      <p>Medication interactions can occur when two or more drugs react with each other, potentially causing unexpected side effects or reducing the effectiveness of one or more medications.</p>
      
      <h3>Types of medication interactions:</h3>
      
      <ul>
        <li><strong>Drug-drug interactions:</strong> When two or more medications interact with each other</li>
        <li><strong>Drug-food interactions:</strong> When medications interact with food or beverages</li>
        <li><strong>Drug-condition interactions:</strong> When existing medical conditions make certain medications potentially harmful</li>
      </ul>
      
      <h3>How PharmaLens helps:</h3>
      
      <p>When you search for a medication on PharmaLens, the app displays potential interactions with other commonly used medications. This information can help you:</p>
      
      <ul>
        <li>Understand which medications should not be taken together</li>
        <li>Know when to space out doses of different medications</li>
        <li>Identify potential side effects from combining medications</li>
      </ul>
      
      <p>Always discuss potential medication interactions with your healthcare provider or pharmacist. PharmaLens provides information for educational purposes, but professional medical advice is essential for medication safety.</p>
    `,
    category: 'results',
    createdAt: '2023-11-02'
  },
  {
    id: '3',
    title: 'How to search for medications by name',
    content: `
      <h2>How to search for medications by name</h2>
      
      <p>PharmaLens offers a powerful search function that allows you to quickly find information about specific medications.</p>
      
      <h3>Basic name search:</h3>
      
      <ol>
        <li>Navigate to the "Search" tab in the PharmaLens app</li>
        <li>Type the medication name in the search bar</li>
        <li>As you type, matching results will appear</li>
        <li>Select the correct medication from the results list</li>
      </ol>
      
      <h3>Advanced search options:</h3>
      
      <p>For more specific searches, you can use these techniques:</p>
      
      <ul>
        <li><strong>Search by brand name</strong> (e.g., "Tylenol") for commercial products</li>
        <li><strong>Search by generic name</strong> (e.g., "acetaminophen") for the active ingredient</li>
        <li><strong>Partial name search</strong> works if you only remember part of the medication name</li>
        <li><strong>Filter results</strong> by medication type, form, or strength</li>
      </ul>
      
      <p>If you're unsure about spelling, PharmaLens will suggest potential matches to help you find the right medication quickly.</p>
    `,
    category: 'searching',
    createdAt: '2023-12-10'
  },
  {
    id: '4',
    title: 'Reading and understanding drug information',
    content: `
      <h2>Reading and understanding drug information</h2>
      
      <p>PharmaLens provides comprehensive medication information in an easy-to-understand format. Here's how to interpret the details shown for each medication:</p>
      
      <h3>Key sections of medication information:</h3>
      
      <ul>
        <li><strong>General Information:</strong> Name, form, strength, and manufacturer</li>
        <li><strong>Uses:</strong> Approved medical conditions for which the medication is prescribed</li>
        <li><strong>Dosage:</strong> Recommended doses for different conditions and age groups</li>
        <li><strong>Side Effects:</strong> Common and serious potential adverse reactions</li>
        <li><strong>Warnings:</strong> Important safety information and precautions</li>
        <li><strong>Interactions:</strong> Potential interactions with other drugs, foods, or conditions</li>
        <li><strong>Storage:</strong> Proper storage conditions to maintain medication effectiveness</li>
      </ul>
      
      <h3>Understanding medical terminology:</h3>
      
      <p>PharmaLens aims to present information in clear language, but some medical terms may be unavoidable. Tap on any highlighted term to see a simple definition.</p>
      
      <p>Remember that medication information should be used as an educational resource. Always follow the specific instructions provided by your healthcare provider, as they will be tailored to your individual needs.</p>
    `,
    category: 'results',
    createdAt: '2024-01-05'
  },
  {
    id: '5',
    title: 'Tips for getting accurate identification results',
    content: `
      <h2>Tips for getting accurate identification results</h2>
      
      <p>The accuracy of PharmaLens pill identification depends greatly on the quality of the image you provide. Follow these best practices to improve your results:</p>
      
      <h3>Optimal photography conditions:</h3>
      
      <ul>
        <li><strong>Lighting:</strong> Use natural daylight or bright, even lighting without shadows</li>
        <li><strong>Background:</strong> Place pills on a solid, contrasting background (white or black works best)</li>
        <li><strong>Focus:</strong> Ensure the image is sharp and clearly shows all markings</li>
        <li><strong>Angle:</strong> Take photos directly above the pill, not at an angle</li>
        <li><strong>Distance:</strong> Get close enough to see details but keep the entire pill in frame</li>
      </ul>
      
      <h3>Improving identification accuracy:</h3>
      
      <ul>
        <li>Clean the pill of any debris or residue before photographing</li>
        <li>Photograph both sides if there are markings on each side</li>
        <li>If available, include the pill's color, shape, and size in manual search parameters</li>
        <li>For coated tablets, ensure any scoring lines or imprints are visible</li>
      </ul>
      
      <p>If PharmaLens provides multiple possible matches, compare the visual characteristics and descriptions to determine the most likely match. Always verify with a healthcare professional if you're uncertain.</p>
    `,
    category: 'visual-identification',
    createdAt: '2024-02-12'
  },
  {
    id: '6',
    title: 'Reporting incorrect information',
    content: `
      <h2>Reporting incorrect information</h2>
      
      <p>PharmaLens strives for accuracy in all medication information. If you believe you've found incorrect or outdated information, we encourage you to report it.</p>
      
      <h3>How to report inaccuracies:</h3>
      
      <ol>
        <li>Navigate to the medication information page containing the error</li>
        <li>Scroll to the bottom of the page and click "Report Information"</li>
        <li>Select the type of issue: incorrect information, outdated details, missing data, or other</li>
        <li>Provide specific details about what you believe is incorrect</li>
        <li>If possible, include a reference to an authoritative source with correct information</li>
        <li>Submit your report</li>
      </ol>
      
      <p>Our pharmacy team reviews all reports and updates information as necessary. This process typically takes 3-5 business days. You will not receive an individual response, but your contribution helps improve PharmaLens for everyone.</p>
      
      <h3>Important note:</h3>
      
      <p>If you believe a medication error could lead to immediate harm, please contact a healthcare professional immediately rather than waiting for our review process.</p>
      
      <p>Thank you for helping us maintain the quality and accuracy of medication information on PharmaLens.</p>
    `,
    category: 'general',
    createdAt: '2024-03-01'
  },
  {
    id: '7',
    title: 'Using the Symptoms Checker effectively',
    content: `
      <h2>Using the Symptoms Checker effectively</h2>
      
      <p>The PharmaLens Symptoms Checker is an AI-powered tool that helps you find appropriate medications based on your symptoms. Here's how to use it effectively:</p>
      
      <h3>Getting Started:</h3>
      
      <ol>
        <li><strong>Navigate to the Symptoms Checker</strong> from the main menu or home page</li>
        <li><strong>Browse symptom categories</strong> organized by medical specialties</li>
        <li><strong>Select your primary symptom</strong> from categories like Headache, Fever, Digestive, Respiratory, etc.</li>
        <li><strong>Review recommendations</strong> for first-line treatments</li>
      </ol>
      
      <h3>Available Symptom Categories:</h3>
      
      <ul>
        <li><strong>HEAD:</strong> Headaches, migraines, tension headaches</li>
        <li><strong>FEVER:</strong> General fever, body aches, chills</li>
        <li><strong>DIGESTIVE:</strong> Nausea, vomiting, stomach pain, acid reflux</li>
        <li><strong>RESPIRATORY:</strong> Cough, cold, congestion, breathing issues</li>
        <li><strong>SKIN:</strong> Allergies, rashes, itching, skin conditions</li>
        <li><strong>JOINTS:</strong> Joint pain, muscle aches, arthritis symptoms</li>
        <li><strong>ENT:</strong> Ear, nose, throat problems</li>
        <li><strong>UTI:</strong> Urinary tract infections and related symptoms</li>
      </ul>
      
      <h3>Understanding Recommendations:</h3>
      
      <p>For each symptom, the system provides:</p>
      
      <ul>
        <li><strong>First-line treatments:</strong> Evidence-based medication recommendations</li>
        <li><strong>Brand and generic names:</strong> Both commercial and generic options</li>
        <li><strong>Layman explanations:</strong> Clear descriptions of how medications work</li>
        <li><strong>Usage guidelines:</strong> Basic information about proper use</li>
      </ul>
      
      <h3>Important Safety Notes:</h3>
      
      <ul>
        <li>Always consult a healthcare professional before starting any new medication</li>
        <li>Check for allergies and existing medical conditions</li>
        <li>Review potential drug interactions if you're taking other medications</li>
        <li>Follow dosage instructions on medication packaging</li>
        <li>Seek immediate medical attention for severe or persistent symptoms</li>
      </ul>
      
      <p>The Symptoms Checker is designed to provide educational information and should not replace professional medical advice or diagnosis.</p>
    `,
    category: 'symptoms-checker',
    createdAt: '2024-03-15'
  },
  {
    id: '8',
    title: 'Understanding Drug Interactions and Safety',
    content: `
      <h2>Understanding Drug Interactions and Safety</h2>
      
      <p>The Drug Interaction Checker is a critical safety tool that helps prevent dangerous medication combinations. Understanding how to use it can protect you from serious health risks.</p>
      
      <h3>How to Use the Drug Interaction Checker:</h3>
      
      <ol>
        <li><strong>Access the tool</strong> from the main menu or home page</li>
        <li><strong>Enter your medications</strong> by typing drug names in the search fields</li>
        <li><strong>Add multiple drugs</strong> to check for interactions between all combinations</li>
        <li><strong>Review results</strong> which show potential interactions with severity levels</li>
        <li><strong>Toggle between views</strong> using the "Simple terms" switch for easier understanding</li>
      </ol>
      
      <h3>Types of Drug Interactions:</h3>
      
      <ul>
        <li><strong>Major Interactions:</strong> Potentially life-threatening combinations that should be avoided</li>
        <li><strong>Moderate Interactions:</strong> Combinations that may require monitoring or dose adjustments</li>
        <li><strong>Minor Interactions:</strong> Generally safe combinations with minimal risk</li>
      </ul>
      
      <h3>Understanding Interaction Information:</h3>
      
      <p>For each interaction, you'll see:</p>
      
      <ul>
        <li><strong>What Happens:</strong> Description of the interaction effect</li>
        <li><strong>What To Do:</strong> Recommended actions and precautions</li>
        <li><strong>Onset Timing:</strong> How quickly the interaction may occur (Rapid, Delayed, etc.)</li>
        <li><strong>Monitoring:</strong> What to watch for or tests that may be needed</li>
        <li><strong>Alternative Options:</strong> Safer medication alternatives when available</li>
      </ul>
      
      <h3>Layman vs. Medical Terms:</h3>
      
      <p>The tool offers two viewing modes:</p>
      
      <ul>
        <li><strong>Simple Terms (Default):</strong> Patient-friendly language like "Both medicines thin your blood"</li>
        <li><strong>Medical Terms:</strong> Professional terminology like "Additive antiplatelet/anticoagulant effect"</li>
      </ul>
      
      <h3>Common Dangerous Interactions:</h3>
      
      <ul>
        <li><strong>Blood thinners + NSAIDs:</strong> Increased bleeding risk</li>
        <li><strong>Sedatives + Alcohol:</strong> Dangerous central nervous system depression</li>
        <li><strong>MAOIs + SSRIs:</strong> Risk of serotonin syndrome</li>
        <li><strong>ACE inhibitors + Potassium supplements:</strong> Dangerous potassium levels</li>
      </ul>
      
      <h3>When to Seek Help:</h3>
      
      <ul>
        <li>If you discover a major interaction between your current medications</li>
        <li>Before starting any new medication while taking others</li>
        <li>If you experience unexpected side effects from medication combinations</li>
        <li>When switching between similar medications</li>
      </ul>
      
      <p>Remember: This tool provides educational information but should not replace consultation with your healthcare provider or pharmacist about medication safety.</p>
    `,
    category: 'drug-interactions',
    createdAt: '2024-03-15'
  },
  {
    id: '9',
    title: 'Maximizing your PharmaLens subscription benefits',
    content: `
      <h2>Maximizing your PharmaLens subscription benefits</h2>
      
      <p>PharmaLens offers different subscription tiers to meet various needs. Here's how to get the most value from your subscription:</p>
      
      <h3>Free Plan Benefits (₹0/month):</h3>
      
      <ul>
        <li><strong>100 drugs database search:</strong> Access basic information for common medications</li>
        <li><strong>5 AI identifications per month:</strong> Use camera feature for pill identification</li>
        <li><strong>Basic drug information:</strong> Essential details about medications</li>
        <li><strong>Mobile web app access:</strong> Use on any device with internet</li>
      </ul>
      
      <h3>Lite Plan Benefits (₹49/month - Save ₹30):</h3>
      
      <ul>
        <li><strong>All Free Plan features</strong></li>
        <li><strong>39 AI identifications per month:</strong> More frequent use of camera identification</li>
        <li><strong>1200+ medicines database:</strong> Expanded medication coverage with advanced search (249 results)</li>
        <li><strong>Priority support:</strong> Faster response to queries and issues</li>
        <li><strong>No ads:</strong> Uninterrupted, clean user experience</li>
        <li><strong>PWA offline access:</strong> Use even with limited connectivity</li>
      </ul>
      
      <h3>Pro Plan Benefits (₹99/month - Save ₹100):</h3>
      
      <ul>
        <li><strong>All Lite Plan features</strong></li>
        <li><strong>101 AI identifications per month:</strong> Extensive camera use capabilities</li>
        <li><strong>1200+ database drugs:</strong> Comprehensive medication coverage with advanced search (500 results)</li>
        <li><strong>Layman explanations:</strong> Simplified medical terminology</li>
        <li><strong>History feature:</strong> Track all your searches and identifications</li>
        <li><strong>Advanced search filters:</strong> More precise medication searches</li>
      </ul>
      

      
      <h3>Tips to Maximize Value:</h3>
      
      <ul>
        <li><strong>Use the history feature</strong> (Pro) to track medications for family members</li>
        <li><strong>Take advantage of extensive identifications</strong> (Pro - 101/month) for medicine cabinet audits</li>
        <li><strong>Utilize advanced search filters</strong> (Pro) to find specific formulations</li>
        <li><strong>Enable layman explanations</strong> (Pro) for better understanding</li>
        <li><strong>Use priority support</strong> (Lite/Pro) for quick assistance</li>
      </ul>
      
      <h3>Payment and Billing:</h3>
      
      <ul>
        <li><strong>Secure PhonePe integration:</strong> Pay with UPI, cards, or digital wallets</li>
        <li><strong>Instant activation:</strong> Features unlock immediately after payment</li>
        <li><strong>Flexible billing:</strong> Choose the plan that fits your usage patterns</li>
        <li><strong>Easy cancellation:</strong> Cancel anytime through your account settings</li>
      </ul>
      
      <h3>Choosing the Right Plan:</h3>
      
      <ul>
        <li><strong>Free Plan:</strong> Occasional users, basic medication lookups</li>
        <li><strong>Lite Plan:</strong> Regular users, need up to 39 identifications monthly</li>
        <li><strong>Pro Plan:</strong> Power users, families, healthcare professionals, comprehensive needs</li>
      </ul>
      
      <p>Consider upgrading if you find yourself hitting usage limits or needing more detailed information regularly.</p>
    `,
    category: 'general',
    createdAt: '2024-03-20'
  },
  {
    id: '10',
    title: 'Mobile optimization and cross-device usage',
    content: `
      <h2>Mobile optimization and cross-device usage</h2>
      
      <p>PharmaLens is designed as a mobile-first web application that works seamlessly across all devices. Here's how to get the best experience:</p>
      
      <h3>Mobile Web App Features:</h3>
      
      <ul>
        <li><strong>Responsive design:</strong> Optimized layouts for phones, tablets, and desktops</li>
        <li><strong>Touch-friendly interface:</strong> Large buttons and easy navigation</li>
        <li><strong>Camera integration:</strong> Direct access to device camera for pill identification</li>
        <li><strong>Offline-ready design:</strong> Minimal data usage and fast loading</li>
        <li><strong>Progressive Web App (PWA):</strong> App-like experience in your browser</li>
      </ul>
      
      <h3>Installing as a Web App:</h3>
      
      <p><strong>On Android:</strong></p>
      <ol>
        <li>Open PharmaLens in Chrome browser</li>
        <li>Tap the menu (three dots) in the top right</li>
        <li>Select "Add to Home screen"</li>
        <li>Confirm installation</li>
      </ol>
      
      <p><strong>On iPhone:</strong></p>
      <ol>
        <li>Open PharmaLens in Safari browser</li>
        <li>Tap the Share button (square with arrow)</li>
        <li>Select "Add to Home Screen"</li>
        <li>Confirm installation</li>
      </ol>
      
      <h3>Cross-Device Synchronization:</h3>
      
      <ul>
        <li><strong>Account-based sync:</strong> Your subscription and history sync across devices</li>
        <li><strong>Universal access:</strong> Use the same account on phone, tablet, and computer</li>
        <li><strong>Consistent experience:</strong> Same features and interface across all devices</li>
      </ul>
      
      <h3>Optimizing Camera Usage:</h3>
      
      <ul>
        <li><strong>Good lighting:</strong> Use natural light or bright indoor lighting</li>
        <li><strong>Steady hands:</strong> Hold device steady for clear photos</li>
        <li><strong>Clean lens:</strong> Wipe camera lens for better image quality</li>
        <li><strong>Proper distance:</strong> Get close enough to see pill details clearly</li>
      </ul>
      
      <h3>Data Usage and Performance:</h3>
      
      <ul>
        <li><strong>Optimized images:</strong> Compressed uploads to save data</li>
        <li><strong>Efficient caching:</strong> Frequently accessed data stored locally</li>
        <li><strong>Fast loading:</strong> Optimized for both WiFi and mobile data</li>
        <li><strong>Battery efficient:</strong> Minimal background processing</li>
      </ul>
      
      <h3>Troubleshooting Common Issues:</h3>
      
      <ul>
        <li><strong>Camera not working:</strong> Check browser permissions for camera access</li>
        <li><strong>Slow loading:</strong> Clear browser cache or try incognito mode</li>
        <li><strong>Layout issues:</strong> Refresh page or try different browser</li>
        <li><strong>Login problems:</strong> Clear cookies and log in again</li>
      </ul>
      
      <h3>Browser Compatibility:</h3>
      
      <ul>
        <li><strong>Recommended:</strong> Chrome, Safari, Firefox, Edge (latest versions)</li>
        <li><strong>Mobile:</strong> Chrome Mobile, Safari Mobile, Samsung Internet</li>
        <li><strong>Features:</strong> All modern browsers support full functionality</li>
      </ul>
      
      <p>For the best experience, keep your browser updated and ensure you have a stable internet connection when using AI identification features.</p>
    `,
    category: 'general',
    createdAt: '2024-03-25'
  }
];

const HelpArticle = () => {
  const { articleId } = useParams();
  const article = helpArticles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-6">Article Not Found</h1>
            <p className="mb-6">The help article you're looking for doesn't exist or has been moved.</p>
            <Link
              to="/help"
              className="inline-flex items-center text-pharma-600 hover:text-pharma-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              to="/help"
              className="inline-flex items-center text-pharma-600 hover:text-pharma-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </div>

          <article className="prose dark:prose-invert prose-a:text-pharma-600 max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </article>

          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(article.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpArticle;
