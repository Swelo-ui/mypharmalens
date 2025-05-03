
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import { Pill, Camera, Check, ChevronRight, ShieldCheck, Database, Brain } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { isMobile } = useMobile();
  
  // Function to handle animations on scroll
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        
        if (isVisible) {
          el.classList.add('visible');
        }
      });
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isMobile ? "pb-16" : ""}`}>
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        {/* Search Section */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8 animate-on-scroll">
              <h2 className="text-3xl font-bold mb-4">
                Find Detailed Information About Any Medication
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Search our comprehensive database for detailed information on medications, including usage, side effects, interactions, and more.
              </p>
            </div>
            
            <SearchBar className="max-w-3xl mx-auto animate-on-scroll" />
            
            <div className="mt-8 text-center animate-on-scroll">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Popular searches: Paracetamol, Ibuprofen, Metformin, Atorvastatin, Amoxicillin
              </p>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
                  Simple Process
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">How PharmaLens Works</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our platform combines advanced AI technology with comprehensive drug databases to provide accurate identification and detailed information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="flex flex-col items-center text-center animate-on-scroll">
                <div className="w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-5 relative">
                  <Camera className="h-7 w-7 text-pharma-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pharma-600 text-white text-sm flex items-center justify-center">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Take a Photo</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Use your camera to take a clear photo of the medication, or upload an existing image.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center animate-on-scroll delay-150">
                <div className="w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-5 relative">
                  <Brain className="h-7 w-7 text-pharma-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pharma-600 text-white text-sm flex items-center justify-center">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Our advanced AI algorithms analyze the image to identify the medication with high accuracy.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center animate-on-scroll delay-300">
                <div className="w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-5 relative">
                  <Database className="h-7 w-7 text-pharma-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pharma-600 text-white text-sm flex items-center justify-center">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Get Results</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Receive comprehensive details about the medication from our trusted pharmaceutical database.
                </p>
              </div>
            </div>
            
            <div className="mt-16 text-center animate-on-scroll">
              <Link to="/identify" className="inline-flex items-center px-6 py-3 rounded-full bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all shadow-lg hover:shadow-xl hover:shadow-pharma-600/20">
                Try It Now
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Trust & Reliability Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="animate-on-scroll">
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Trusted Data
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Reliable & Verified Information</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  We prioritize accuracy and reliability in our medication database. All information is sourced from trusted pharmaceutical references and verified by healthcare professionals.
                </p>
                
                <ul className="space-y-4">
                  {[
                    "Comprehensive database of medications",
                    "Verified by healthcare professionals",
                    "Regular updates with latest information",
                    "Stringent quality control measures",
                    "Transparent references and sources"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="glass-card p-8 rounded-2xl shadow-xl animate-on-scroll">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-pharma-600" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-center mb-6">Our Data Sources</h3>
                
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <h4 className="font-medium mb-2">Pharmaceutical Databases</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We integrate with trusted sources like Drugs.com and India Drug Index for comprehensive medication data.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <h4 className="font-medium mb-2">Healthcare Professionals</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Our information is reviewed by licensed pharmacists and physicians for accuracy and completeness.
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <h4 className="font-medium mb-2">Regulatory Bodies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We keep up with guidelines from FDA, EMA, and other international regulatory authorities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-pharma-900 to-pharma-700 text-white">
          <div className="container mx-auto px-4 max-w-5xl text-center animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Access Comprehensive Drug Information Today
            </h2>
            <p className="text-pharma-100 max-w-3xl mx-auto mb-10 text-lg">
              Whether you're a healthcare professional, patient, or caregiver, PharmaLens provides the medication information you need, when you need it.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/search" className="px-8 py-3 rounded-full bg-white text-pharma-800 font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto">
                Start Searching
              </Link>
              <Link to="/identify" className="px-8 py-3 rounded-full bg-pharma-600 text-white font-medium border border-pharma-500 hover:bg-pharma-500 transition-all hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto">
                Identify Medication
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
