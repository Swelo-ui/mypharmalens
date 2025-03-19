
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Pill, Brain, Camera, Database, Shield, CheckCircle2, Mail, Linkedin, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Fix animation issue by adding proper animation classes
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          (entry.target as HTMLElement).style.opacity = '1';
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => {
      (element as HTMLElement).style.opacity = '0';
      observer.observe(element);
    });
    
    return () => {
      elements.forEach(element => observer.unobserve(element));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-pharma-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8 animate-fade-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                About PharmaLens
              </h1>
              <div className="w-24 h-1 bg-pharma-500 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Bridging the gap between technology and medicine through AI-powered medication identification and information.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="animate-on-scroll">
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                    Our Mission
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-6 relative inline-block after:content-[''] after:block after:w-20 after:h-1 after:bg-pharma-500 after:mt-2">Empowering Healthcare Through Technology</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  PharmaLens was created with a vision to revolutionize how people identify and understand medications. Whether you're a healthcare professional, student, or patient, our platform provides accurate, reliable information when you need it most.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  By combining cutting-edge AI technology with comprehensive pharmaceutical databases, we've built a tool that helps prevent medication errors, improve patient education, and support healthcare professionals in their daily practice.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 animate-on-scroll">
                <h3 className="text-xl font-semibold mb-6">Our Core Values</h3>
                
                <div className="space-y-5">
                  {[
                    { icon: <Shield className="h-5 w-5 text-pharma-600" />, title: "Accuracy", desc: "Providing precise and verified medication information" },
                    { icon: <Database className="h-5 w-5 text-pharma-600" />, title: "Comprehensiveness", desc: "Offering detailed information on a wide range of medications" },
                    { icon: <Brain className="h-5 w-5 text-pharma-600" />, title: "Innovation", desc: "Continuously improving our AI algorithms for better results" },
                    { icon: <Bookmark className="h-5 w-5 text-pharma-600" />, title: "Accessibility", desc: "Making pharmaceutical information available to everyone" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 mt-1 shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                  Key Features
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Comprehensive Medication Management</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                PharmaLens offers a suite of powerful features designed to make medication identification and information access simple and accurate.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {[
                {
                  icon: <Camera className="h-8 w-8 text-pharma-600" />,
                  title: "AI-Powered Visual Identification",
                  desc: "Upload a photo of any medication and our advanced AI will identify it with high accuracy."
                },
                {
                  icon: <Database className="h-8 w-8 text-pharma-600" />,
                  title: "Comprehensive Drug Database",
                  desc: "Access detailed information about medications, including usage instructions, side effects, and interactions."
                },
                {
                  icon: <Pill className="h-8 w-8 text-pharma-600" />,
                  title: "Smart Search Functionality",
                  desc: "Find medications quickly by name, active ingredient, or manufacturer."
                },
                {
                  icon: <FileText className="h-8 w-8 text-pharma-600" />,
                  title: "Educational Resources",
                  desc: "Access medication guides and usage instructions to better understand your prescriptions."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 animate-on-scroll">
                  <div className="w-12 h-12 rounded-lg bg-pharma-50 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Creator Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 animate-on-scroll">
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                    About the Creator
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-6 relative inline-block after:content-[''] after:block after:w-20 after:h-1 after:bg-pharma-500 after:mt-2">Meet Himanshu Sharma</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  PharmaLens is developed by Himanshu Sharma, a B.Pharm student at Shriram College of Pharmacy, Morena, with a passion for AI and healthcare innovation. With expertise in pharmacovigilance and pharmaceutical research, Himanshu aims to bridge the gap between technology and medicine to create solutions that benefit students and professionals alike.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <a 
                    href="mailto:himanshusharma.shriram@gmail.com" 
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-pharma-600 text-white hover:bg-pharma-700 transition-all shadow-md"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact via Email
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/himanshu-sharma-374421326" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-pharma-600 text-pharma-600 hover:bg-pharma-50 dark:hover:bg-pharma-900/10 transition-all shadow-md"
                  >
                    <Linkedin className="h-5 w-5 mr-2" />
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
              
              <div className="order-1 md:order-2 flex justify-center animate-on-scroll">
                <Card className="overflow-hidden border-0 shadow-lg max-w-sm">
                  <CardContent className="p-0">
                    <img 
                      src="/lovable-uploads/b0f69091-6398-44ec-ab75-fbdd269964e4.png" 
                      alt="Himanshu Sharma" 
                      className="w-full h-auto object-cover"
                      style={{ 
                        maxWidth: "100%",
                        filter: "contrast(1.05) brightness(1.02)"
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-pharma-600 text-white">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6 animate-on-scroll">Ready to Experience PharmaLens?</h2>
            <p className="text-pharma-100 max-w-3xl mx-auto mb-10 animate-on-scroll">
              Start using our powerful medication identification and information tools today. Whether you're a healthcare professional, student, or patient, PharmaLens is here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-on-scroll">
              <Link to="/identify" className="px-8 py-3 rounded-lg bg-white text-pharma-800 font-medium hover:bg-gray-100 transition-all shadow-md">
                Try Visual Identification
              </Link>
              <Link to="/search" className="px-8 py-3 rounded-lg bg-pharma-700 text-white font-medium border border-pharma-500 hover:bg-pharma-800 transition-all shadow-md">
                Search Medications
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
