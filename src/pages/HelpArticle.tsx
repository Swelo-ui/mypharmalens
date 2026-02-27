
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HelpArticleContent from '@/components/HelpArticle';
import SEOHead from '@/components/SEOHead';
import { helpArticles } from '@/components/HelpArticle';

const HelpArticlePage = () => {
  const { articleId } = useParams();
  const article = helpArticles.find((item) => item.id === articleId);
  const title = article ? `${article.title} | PharmaLens Help` : "Help Article Not Found | PharmaLens";
  const description = article
    ? `Learn about ${article.title.toLowerCase()} with PharmaLens help guides.`
    : "The help article you are looking for could not be found.";

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={title}
        description={description}
        canonicalUrl={article ? `/help/article/${articleId}` : "/help"}
        noIndex={!article}
      />
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <HelpArticleContent />
      </main>
      <Footer />
    </div>
  );
};

export default HelpArticlePage;
