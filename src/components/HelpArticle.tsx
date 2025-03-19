
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

// Define the structure of our help articles
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'visual-identification' | 'searching' | 'results' | 'general';
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
