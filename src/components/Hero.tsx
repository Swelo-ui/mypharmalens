
import React, { useEffect, useRef } from 'react';
import { Search, Camera, Pill, Calendar, FileText, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
      icon: <Calendar className="h-6 w-6 text-pharma-600" />,
      title: 'Medication Schedules',
      description: 'Create personalized medication schedules with timely reminders.',
    },
    {
      icon: <FileText className="h-6 w-6 text-pharma-600" />,
      title: 'Research Access',
      description: 'Stay informed with the latest pharmaceutical research and drug updates.',
    },
    {
      icon: <Heart className="h-6 w-6 text-pharma-600" />,
      title: 'Health Monitoring',
      description: 'Track your health metrics in relation to your medication usage.',
    },
    {
      icon: <Search className="h-6 w-6 text-pharma-600" />,
      title: 'Smart Search',
      description: 'Find medications by name, category, manufacturer, or symptoms they treat.',
    },
  ];

  return (
    <div className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-pharma-50/50 to-transparent -z-10"></div>
      
      {/* Animated Circles */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-pharma-300/10 rounded-full filter blur-3xl animate-pulse-subtle -z-10"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-pharma-200/20 rounded-full filter blur-3xl animate-pulse-subtle delay-700 -z-10"></div>
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Main Hero Content */}
        <div className="text-center mb-16 md:mb-24 animate-fade-up">
          <div className="inline-block mb-3">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800">
              AI-Powered Drug Identification
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Identify & Learn About
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pharma-600 to-pharma-400"> Any Medication</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-xl max-w-3xl mx-auto mb-8">
            PharmaLens combines AI technology with comprehensive drug databases to help you identify medications and access reliable information instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search" className="px-8 py-3 rounded-full bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-pharma-600/20 w-full sm:w-auto">
              Search Medications
            </Link>
            <Link to="/identify" className="px-8 py-3 rounded-full bg-white text-pharma-800 font-medium border border-gray-200 hover:bg-gray-50 transition-all hover:scale-105 shadow-md hover:shadow-lg w-full sm:w-auto">
              Identify with Camera
            </Link>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              ref={(el) => (featureRefs.current[i] = el)}
              className={cn(
                "animate-on-scroll p-6 rounded-2xl glass-card transition-all duration-300 hover:shadow-xl",
                "hover:translate-y-[-4px]"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm mb-4">
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
