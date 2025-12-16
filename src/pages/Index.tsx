import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import SponsorCarousel from '@/components/SponsorCarousel';
import BottomNavigation from '@/components/BottomNavigation';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Pill, Camera, Check, ChevronRight, ShieldCheck, Database, Brain, Clock, Crown, ArrowRight, Stethoscope, AlertTriangle, Users, TrendingUp, Activity, Zap } from 'lucide-react';
import CountUpNumber from '@/components/CountUpNumber';

const Index = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PharmaLens - AI Medication Identification App",
    "alternateName": ["PharmaLens", "PharmaLens AI", "PharmaLens Tech"],
    "description": "PharmaLens is an AI-powered medication identification application. Take a photo of any pill or medication and instantly identify it using artificial intelligence. Access comprehensive drug information including side effects, dosages, interactions, and safety warnings.",
    "disambiguatingDescription": "PharmaLens is a healthcare AI application for identifying medications and pills at pharmalens.tech. NOT related to contact lenses or optical products. Uses artificial intelligence to recognize medications from photos.",
    "url": "https://pharmalens.tech",
    "applicationCategory": "HealthApplication",
    "applicationSubCategory": "Medical",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5"
    },
    "featureList": [
      "AI-powered medication identification from photos",
      "Comprehensive drug database with 1000+ medications",
      "Drug interaction checker",
      "Symptom-based medicine recommendations",
      "Side effects and dosage information",
      "Visual pill identification"
    ],
    "keywords": "medication identifier, pill identifier, drug identification, AI medicine app, pharmacy app, drug information, pill scanner, free pill finder, camera medication identifier, what pill is this, identify medicine by photo, drug lookup app, medicine database, AI pharmacist, drug interaction checker, symptom checker"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="PharmaLens - AI-Powered Medication Identification & Drug Information"
        description="Identify medications instantly with AI technology. Access comprehensive drug information, side effects, dosages, and interactions. Free medication identifier and pharmaceutical database."
        keywords="medication identifier, pill identifier, drug information, AI medication app, pharmaceutical database, medicine lookup app, drug interactions checker, side effects database, dosage information, prescription drugs database, OTC medications, AI pharmacist, free drug identifier, medicine information app, pill scanner app, camera medicine identification"
        canonicalUrl="/"
        structuredData={structuredData}
      />

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
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
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

        {/* Advanced Features Section */}
        <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
                  Advanced Features
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Comprehensive Healthcare Tools</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Beyond medication identification, PharmaLens offers powerful tools to help you understand symptoms and check for dangerous drug interactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-stretch">
              {/* Symptoms Checker Feature */}
              <div className="animate-on-scroll h-full">
                <div className="bg-gradient-to-br from-pharma-50 to-pharma-100 dark:from-pharma-900/20 dark:to-pharma-800/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-pharma-200 dark:border-pharma-800 flex flex-col h-full">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-pharma-600 flex items-center justify-center mr-4">
                      <Stethoscope className="h-7 w-7 sm:h-8 sm:w-8 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-pharma-900 dark:text-pharma-100">Symptoms Checker</h3>
                      <p className="text-pharma-700 dark:text-pharma-300">AI-powered symptom analysis</p>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-6 break-words">
                    Get personalized medication recommendations based on your symptoms. Our intelligent system analyzes your symptoms and suggests appropriate first-line treatments from our comprehensive database.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-pharma-600 flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-pharma-900 dark:text-pharma-100">Professional Categories</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Organized by medical specialties: Headache, Fever, Digestive, Respiratory, and more</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-pharma-600 flex items-center justify-center mr-3 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-pharma-900 dark:text-pharma-100">First-Line Treatments</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Evidence-based medication recommendations for common symptoms</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-pharma-600 flex items-center justify-center mr-3 mt-0.5">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-pharma-900 dark:text-pharma-100">Layman-Friendly</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Clear explanations in simple terms for better understanding</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/symptom-checker" className="mt-auto inline-flex items-center px-6 py-3 rounded-full bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all shadow-lg hover:shadow-xl hover:shadow-pharma-600/20">
                    Try Symptoms Checker
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Drug Interactions Feature */}
              <div className="animate-on-scroll delay-150 h-full">
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-red-200 dark:border-red-800 flex flex-col h-full">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center mr-4">
                      <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-white flex-shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">Drug Interactions</h3>
                      <p className="text-red-700 dark:text-red-300">Safety-first interaction checking</p>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-6 break-words">
                    Protect yourself from dangerous drug combinations. Our comprehensive interaction checker analyzes potential risks between medications and provides clear safety guidance.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center mr-3 mt-0.5">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">Real-Time Analysis</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Instant detection of potentially harmful drug combinations</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center mr-3 mt-0.5">
                        <Activity className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">Clinical Metadata</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Onset timing, monitoring requirements, and severity levels</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center mr-3 mt-0.5">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">Simple & Medical Terms</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between layman terms and medical terminology</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/drug-interactions" className="mt-auto inline-flex items-center px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:shadow-red-600/20">
                    Check Interactions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature Statistics */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-on-scroll">
              <div className="text-center">
                <div className="text-3xl font-bold text-pharma-600 mb-2">
                  <CountUpNumber end={50} suffix="+" duration={2000} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Symptom Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pharma-600 mb-2">
                  <CountUpNumber end={1000} suffix="+" duration={2200} delay={100} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Drug Interactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pharma-600 mb-2">
                  <CountUpNumber end={99.9} suffix="%" duration={2400} delay={200} decimals={1} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Safety Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pharma-600 mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
                  Choose Your Plan
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Unlock Premium Features</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the perfect plan for your medication identification needs. From basic searches to unlimited AI-powered identifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 animate-on-scroll">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mx-auto mb-4">
                    <Pill className="h-6 w-6 text-pharma-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Free Plan</h3>
                  <div className="text-3xl font-bold text-pharma-600 mb-2">₹0<span className="text-lg font-normal text-gray-500">/month</span></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for occasional users</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">100 drugs database search</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">5 AI identifications per month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Basic drug information</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Mobile web app access</span>
                  </li>
                </ul>

                <Link to="/identify" className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full border border-pharma-600 text-pharma-600 font-medium hover:bg-pharma-50 transition-all">
                  Get Started Free
                </Link>
              </div>

              {/* Lite Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-pharma-300 animate-on-scroll delay-150">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-pharma-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Lite Plan</h3>
                  <div className="mb-2">
                    <span className="text-lg text-gray-400 line-through">₹79</span>
                    <div className="text-3xl font-bold text-pharma-600">₹49<span className="text-lg font-normal text-gray-500">/month</span></div>
                  </div>
                  <p className="text-sm text-green-600 font-semibold">Save ₹30/month</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">39 AI identifications/month</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">All Free Plan features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Advanced search (249 results)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">1200+ medicines database</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">PWA offline access</span>
                  </li>
                </ul>

                <Link to="/subscription-manager" className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all">
                  Choose Lite
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-pharma-50 to-pharma-100 dark:from-pharma-900/20 dark:to-pharma-800/20 rounded-2xl p-8 shadow-xl border border-pharma-500 relative animate-on-scroll delay-300">
                <div className="absolute top-0 left-0 right-0 bg-pharma-600 text-white text-center py-2 text-sm font-medium rounded-t-2xl">
                  <Crown className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>

                <div className="text-center mb-6 pt-4">
                  <div className="w-12 h-12 rounded-full bg-pharma-600 flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Pro Plan</h3>
                  <div className="mb-2">
                    <span className="text-lg text-gray-400 line-through">₹199</span>
                    <div className="text-3xl font-bold text-pharma-600">₹99<span className="text-lg font-normal text-gray-500">/month</span></div>
                  </div>
                  <p className="text-sm text-green-600 font-semibold">Save ₹100/month</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">101 AI identifications/month</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">All Lite Plan features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Advanced search (500 results)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">1200+ medicines database</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Layman explanations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">History feature (unlimited)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">Advanced search filters</span>
                  </li>
                </ul>

                <Link to="/subscription-manager" className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all shadow-lg">
                  Choose Pro
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>

            <div className="mt-12 text-center animate-on-scroll">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Need help choosing the right plan?
              </p>
              <Link to="/subscription-manager" className="inline-flex items-center text-pharma-600 hover:text-pharma-700 font-medium">
                View detailed comparison
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Trust & Reliability Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
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

              <div className="animate-on-scroll delay-150">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-6">
                    <ShieldCheck className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold">Quality Assurance</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Our commitment to accuracy means you can trust the information provided for your healthcare decisions.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-pharma-50 dark:bg-pharma-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-pharma-600">
                        <CountUpNumber end={99.5} suffix="%" duration={2000} decimals={1} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
                    </div>
                    <div className="p-4 bg-pharma-50 dark:bg-pharma-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-pharma-600">
                        <CountUpNumber end={1000} suffix="+" duration={2200} delay={100} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Medications</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive Data Sources & Technology Section */}
        <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
                  Data & Technology
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Powered by Advanced Technology & Trusted Sources</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our platform combines cutting-edge AI technology with verified pharmaceutical databases to deliver accurate medication identification and comprehensive drug information.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Data Sources */}
              <div className="animate-on-scroll">
                <div className="glass-card p-8 rounded-2xl shadow-xl">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center">
                      <Database className="h-10 w-10 text-pharma-600" />
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

              {/* AI Technology & Features */}
              <div className="animate-on-scroll delay-150">
                <div className="glass-card p-8 rounded-2xl shadow-xl">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center">
                      <Brain className="h-10 w-10 text-pharma-600" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-center mb-6">AI-Powered Technology</h3>

                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                      <h4 className="font-medium mb-2">Advanced Image Recognition</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Our AI analyzes pill shape, color, imprint, and size to accurately identify medications from photos.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                      <h4 className="font-medium mb-2">Smart Search Algorithm</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Intelligent search that understands partial names, generic/brand variations, and common misspellings.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                      <h4 className="font-medium mb-2">Real-time Updates</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Our database is continuously updated with new medications, recalls, and safety information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features Row */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center animate-on-scroll">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">HIPAA Compliant</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your privacy is protected with enterprise-grade security and HIPAA compliance standards.
                </p>
              </div>

              <div className="text-center animate-on-scroll delay-150">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">24/7 Availability</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Access medication information anytime, anywhere with our reliable cloud infrastructure.
                </p>
              </div>

              <div className="text-center animate-on-scroll delay-300">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">Multi-Language Support</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Available in multiple languages to serve healthcare professionals and patients globally.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SponsorCarousel />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-pharma-600 to-pharma-700 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform Your Medication Management?
            </h2>
            <p className="text-xl text-pharma-100 mb-8">
              Join thousands of healthcare professionals who trust PharmaLens for accurate drug identification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-pharma-600 hover:bg-gray-100" onClick={() => navigate('/search')}>
                Start Searching
              </Button>
              <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-pharma-600 dark:text-white dark:hover:bg-white dark:hover:text-pharma-600" onClick={() => navigate('/identify')}>
                Identify Medication
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default Index;
