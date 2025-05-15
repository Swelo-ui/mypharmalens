
import React, { useEffect, useRef } from 'react';
import { Search, Camera, Pill, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AuroraBackground } from '@/components/ui/aurora-background';

const Hero = () => {
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );
    
    featureRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    
    return () => {
      featureRefs.current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);
  
  // Updated features to only include those actually implemented in PharmaLens
  const features = [
    {
      icon: <Pill className="h-6 w-6 text-pharma-600" />,
      title: 'Drug Information',
      description: 'Access comprehensive drug data including uses, dosages, side effects, and precautions.',
    },
    {
      icon: <Camera className="h-6 w-6 text-pharma-600" />,
      title: 'Visual Identification',
      description: 'Upload an image of any medication to identify it with our AI-powered recognition system.',
    },
    {
      icon: <Search className="h-6 w-6 text-pharma-600" />,
      title: 'Smart Search',
      description: 'Find medications by name, category, manufacturer, or conditions they treat.',
    },
    {
      icon: <FileText className="h-6 w-6 text-pharma-600" />,
      title: 'Educational Resources',
      description: 'Access medication guides and educational content to better understand your prescriptions.',
    },
  ];

  return (
    <div className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
      {/* Aurora background instead of gradient */}
      <AuroraBackground className="absolute inset-0 z-0 h-full" showRadialGradient={true}>
        {/* This is where the aurora effect will appear */}
      </AuroraBackground>
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Main Hero Content */}
        <div className="text-center mb-12 md:mb-16 animate-fade-up">
          <div className="inline-block mb-3">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
              AI-Powered Drug Identification
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Identify & Learn About
            <span className="text-pharma-600"> Any Medication</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-3xl mx-auto mb-6">
            PharmaLens combines AI technology with comprehensive drug databases to help you identify medications and access reliable information instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search" className="px-6 py-2.5 rounded-md bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all shadow-md w-full sm:w-auto">
              Search Medications
            </Link>
            <Link to="/identify" className="px-6 py-2.5 rounded-md bg-white text-pharma-800 font-medium border border-gray-200 hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto">
              Identify with Camera
            </Link>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              ref={(el) => (featureRefs.current[i] = el)}
              className={cn(
                "animate-on-scroll p-6 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm",
                "hover:shadow-md transition-all duration-300"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-pharma-50 dark:bg-gray-700 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
