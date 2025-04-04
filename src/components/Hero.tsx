
import React, { useEffect, useRef } from 'react';
import { Search, Camera, Pill, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  // Subscription plans for the hero section
  const subscriptionPlans = [
    {
      name: "Free",
      price: 0,
      identifications: 5,
      features: [
        "Basic drug identification",
        "Limited history storage (10 items)",
        "Standard response time"
      ],
      buttonText: "Get Started",
      highlighted: false
    },
    {
      name: "Advanced",
      price: 299,
      identifications: 30,
      features: [
        "Enhanced drug identification",
        "Full history access (100 items)",
        "Faster response time",
        "Detailed medication reports"
      ],
      buttonText: "Upgrade Now",
      highlighted: true
    },
    {
      name: "Elite",
      price: 599,
      identifications: 100,
      features: [
        "Premium drug identification",
        "Unlimited history storage",
        "Priority response time",
        "Comprehensive medication reports"
      ],
      buttonText: "Go Premium",
      highlighted: false
    }
  ];

  return (
    <div className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-pharma-50/50 to-transparent -z-10"></div>
      
      <div className="container mx-auto px-4 max-w-6xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
        
        {/* Subscription Plans */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Choose Your Plan</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto mb-10">
            Select the subscription that fits your needs and enhance your medication identification experience
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, index) => (
              <div 
                key={index}
                className={cn(
                  "rounded-xl border bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300",
                  plan.highlighted ? "border-pharma-500 shadow-md dark:border-pharma-400" : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 font-medium">
                    {plan.identifications} identifications per month
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-pharma-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/subscription">
                  <Button 
                    variant={plan.highlighted ? "default" : "outline"} 
                    className={cn(
                      "w-full", 
                      plan.highlighted ? "bg-pharma-600 hover:bg-pharma-700" : ""
                    )}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/subscription?compare=true" className="text-pharma-600 hover:text-pharma-800 font-medium transition-colors">
              Compare all features →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
