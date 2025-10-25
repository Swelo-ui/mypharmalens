import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubscriptionManager from '@/components/SubscriptionManager';

const SubscriptionManagerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          <SubscriptionManager />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionManagerPage;
