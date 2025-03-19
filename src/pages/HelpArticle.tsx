
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HelpArticleContent from '@/components/HelpArticle';

const HelpArticlePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <HelpArticleContent />
      </main>
      <Footer />
    </div>
  );
};

export default HelpArticlePage;
