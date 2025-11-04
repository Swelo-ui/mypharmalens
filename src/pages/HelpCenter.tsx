import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Camera, FileText, MessageCircle, Mail, PenTool, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { helpArticles } from '@/components/HelpArticle';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredArticles = helpArticles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">PharmaLens Help Center</h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Find answers to common questions, learn how to use our features, and get support when you need it.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-12 sm:mb-16 px-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for help articles..."
                className="block w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pharma-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {searchQuery && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {filteredArticles.length > 0 ? (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredArticles.map(article => (
                      <li key={article.id}>
                        <Link
                          to={`/help/article/${article.id}`}
                          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <h3 className="font-medium text-pharma-600">{article.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {article.content.substring(0, 100).replace(/<[^>]*>/g, '')}...
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No articles found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-3 sm:mb-4">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-pharma-600" />
              </div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">Visual Identification</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Learn how to use our camera feature to identify pills and medications visually.
              </p>
              <Link 
                to="/help/visual-identification" 
                className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
              >
                Read guides <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-3 sm:mb-4">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-pharma-600" />
              </div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">Searching</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Tips and tricks for finding medications using our search functionality.
              </p>
              <Link 
                to="/help/searching" 
                className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
              >
                Read guides <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-3 sm:mb-4">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-pharma-600" />
              </div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">Understanding Results</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                How to interpret and understand the medication information provided.
              </p>
              <Link 
                to="/help/results" 
                className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
              >
                Read guides <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 sm:mb-4">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">Symptoms Checker</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Learn how to use our AI-powered symptom analysis for medication recommendations.
              </p>
              <Link 
                to="/help/article/7" 
                className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
              >
                Read guides <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3 sm:mb-4">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <h3 className="font-medium mb-2 text-sm sm:text-base">Drug Interactions</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Understanding drug interactions and how to use our safety checker effectively.
              </p>
              <Link 
                to="/help/article/8" 
                className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
              >
                Read guides <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 sm:p-8 mb-16">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Need More Help?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base px-2">
                Our support team is ready to assist you with any questions or issues you may have.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-pharma-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">Contact Support</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 leading-relaxed">
                      Get help with technical issues or ask questions about using PharmaLens.
                    </p>
                    <Link 
                      to="/contact" 
                      className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium"
                    >
                      Contact us <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-pharma-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">Email Us</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 leading-relaxed">
                      Send an email directly to our support team for personalized assistance.
                    </p>
                    <a 
                      href="mailto:himanshusharma.shriram@gmail.com" 
                      className="text-pharma-600 hover:text-pharma-700 inline-flex items-center text-xs sm:text-sm font-medium break-all"
                    >
                      <span className="break-all">himanshusharma.shriram@gmail.com</span>
                      <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-2">Popular Help Articles</h2>
            <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2 md:gap-x-8">
              {helpArticles.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/help/article/${article.id}`}
                  className="flex items-center p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <PenTool className="h-4 w-4 sm:h-5 sm:w-5 text-pharma-600 mr-3 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base group-hover:text-pharma-600 dark:group-hover:text-pharma-400 transition-colors">
                    {article.title}
                  </span>
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
