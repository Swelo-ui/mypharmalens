
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, FileText } from 'lucide-react';
import { helpArticles } from '@/components/HelpArticle';
import SEOHead from '@/components/SEOHead';

const HelpCategory = () => {
  const { categoryId } = useParams();
  
  // Convert category ID from URL format to internal format
  const categoryMap: Record<string, string> = {
    'visual-identification': 'visual-identification',
    'searching': 'searching',
    'results': 'results',
    'general': 'general'
  };
  
  const categoryName = categoryId ? categoryMap[categoryId] : '';
  
  // Get display name for the category
  const displayNames: Record<string, string> = {
    'visual-identification': 'Visual Identification Guides',
    'searching': 'Searching for Medications',
    'results': 'Understanding Results',
    'general': 'General Help'
  };
  
  const displayName = categoryId ? displayNames[categoryId] : 'Help Articles';
  
  // Filter articles by category
  const filteredArticles = helpArticles.filter(
    article => !categoryName || article.category === categoryName
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${displayName} | PharmaLens Help`}
        description={`Browse ${displayName.toLowerCase()} in the PharmaLens help center.`}
        canonicalUrl={`/help/${categoryId}`}
      />
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Link 
              to="/help"
              className="inline-flex items-center text-pharma-600 hover:text-pharma-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </div>
          
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-4">{displayName}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Browse through our collection of help articles in this category.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredArticles.map(article => (
              <Link 
                key={article.id}
                to={`/help/article/${article.id}`}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start"
              >
                <FileText className="h-5 w-5 text-pharma-600 mr-4 mt-1 shrink-0" />
                <div>
                  <h3 className="font-medium mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {article.content.substring(0, 150).replace(/<[^>]*>/g, '')}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No articles found in this category.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HelpCategory;
