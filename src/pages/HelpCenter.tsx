
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Camera, FileText, MessageCircle, Mail, PenTool, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpCenter = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">PharmaLens Help Center</h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions, learn how to use our features, and get support when you need it.
            </p>
          </div>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for help articles..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pharma-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-pharma-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Using Visual Identification</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                Learn how to take good photos of medications and get the most accurate identification results.
              </p>
              <Link to="/help/visual-identification" className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-sm font-medium">
                Read guides <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-pharma-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Searching for Medications</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                Tips for finding medications quickly using names, ingredients, or physical characteristics.
              </p>
              <Link to="/help/searching" className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-sm font-medium">
                Read guides <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-pharma-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Understanding Results</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                How to interpret medication information, including usage, side effects, and interactions.
              </p>
              <Link to="/help/results" className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-sm font-medium">
                Read guides <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Need More Help?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Our support team is ready to assist you with any questions or issues you may have.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start">
                <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 shrink-0">
                  <MessageCircle className="h-6 w-6 text-pharma-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Contact Support</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Get help with technical issues or ask questions about using PharmaLens.
                  </p>
                  <Link to="/contact" className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-sm font-medium">
                    Contact us <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start">
                <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 shrink-0">
                  <Mail className="h-6 w-6 text-pharma-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Email Us</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Send an email directly to our support team for personalized assistance.
                  </p>
                  <a 
                    href="mailto:himanshusharma.shriram@gmail.com" 
                    className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-sm font-medium"
                  >
                    himanshusharma.shriram@gmail.com <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Popular Articles */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Popular Help Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                "How to identify a pill using PharmaLens",
                "Understanding medication interactions",
                "How to search for medications by name",
                "Reading and understanding drug information",
                "Tips for getting accurate identification results",
                "Reporting incorrect information"
              ].map((title, i) => (
                <Link 
                  key={i} 
                  to={`/help/article/${i+1}`}
                  className="flex items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <PenTool className="h-5 w-5 text-pharma-600 mr-3 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200">{title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HelpCenter;
