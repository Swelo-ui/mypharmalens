
import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import { useMediaQuery } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  return (
    <div className="min-h-screen flex flex-col bg-[#FEF6EE]">
      <Header />
      
      <main className="flex-1">
        <Hero />
      </main>
      
      <Footer />
      
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default Index;
