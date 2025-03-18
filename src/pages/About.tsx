
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Pill, Brain, Camera, Database, Shield, MessageCircle, Bookmark, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-pharma-50 to-white dark:from-gray-900 dark:to-gray-950 py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About PharmaLens</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Bridging the gap between technology and medicine through AI-powered medication identification and information.
              </p>
            </div>
            
            <div className="flex justify-center">
              <img 
                src="/placeholder.svg" 
                alt="PharmaLens Application" 
                className="rounded-xl shadow-2xl w-full max-w-4xl"
              />
            </div>
          </div>
        </section>
        
        {/* Mission Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                    Our Mission
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Empowering Healthcare Through Technology</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  PharmaLens was created with a vision to revolutionize how people identify and understand medications. Whether you're a healthcare professional, student, or patient, our platform provides accurate, reliable information when you need it most.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  By combining cutting-edge AI technology with comprehensive pharmaceutical databases, we've built a tool that helps prevent medication errors, improve patient education, and support healthcare professionals in their daily practice.
                </p>
              </div>
              
              <div className="glass-card p-8 rounded-2xl shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-6">Our Core Values</h3>
                
                <div className="space-y-5">
                  {[
                    { icon: <Shield className="h-5 w-5 text-pharma-600" />, title: "Accuracy", desc: "Providing precise and verified medication information" },
                    { icon: <Database className="h-5 w-5 text-pharma-600" />, title: "Comprehensiveness", desc: "Offering detailed information on a wide range of medications" },
                    { icon: <Brain className="h-5 w-5 text-pharma-600" />, title: "Innovation", desc: "Continuously improving our AI algorithms for better results" },
                    { icon: <Bookmark className="h-5 w-5 text-pharma-600" />, title: "Accessibility", desc: "Making pharmaceutical information available to everyone" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start">
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
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Camera className="h-8 w-8 text-pharma-600" />,
                  title: "AI-Powered Visual Identification",
                  desc: "Upload a photo of any medication and our advanced AI will identify it with high accuracy, even with blurry or low-quality images.",
                  image: "/placeholder.svg"
                },
                {
                  icon: <Database className="h-8 w-8 text-pharma-600" />,
                  title: "Comprehensive Drug Database",
                  desc: "Access detailed information about thousands of medications, including usage instructions, side effects, interactions, and more.",
                  image: "/placeholder.svg"
                },
                {
                  icon: <Pill className="h-8 w-8 text-pharma-600" />,
                  title: "Smart Search Functionality",
                  desc: "Find medications quickly by name, active ingredient, manufacturer, or even by describing their physical characteristics.",
                  image: "/placeholder.svg"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {[
                {
                  title: "Educational Resources",
                  desc: "Access medication guides, usage instructions, and educational content to better understand your prescriptions."
                },
                {
                  title: "High-Accuracy Results",
                  desc: "Our AI models are trained on vast datasets of medication images to ensure precise identification in various conditions."
                },
                {
                  title: "User-Friendly Interface",
                  desc: "Intuitive design makes it easy for anyone to access medication information quickly and efficiently."
                },
                {
                  title: "Continuous Improvements",
                  desc: "We regularly update our AI models and databases to improve accuracy and expand our medication coverage."
                }
              ].map((item, i) => (
                <div key={i} className="flex items-start">
                  <div className="shrink-0 mr-3">
                    <CheckCircle2 className="h-5 w-5 text-pharma-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Creator Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="inline-block mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                    About the Creator
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Meet Himanshu Sharma</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  PharmaLens is developed by Himanshu Sharma, a B.Pharm student at Shriram College of Pharmacy, Morena, with a passion for AI and healthcare innovation. With expertise in pharmacovigilance and pharmaceutical research, Himanshu aims to bridge the gap between technology and medicine to create solutions that benefit students and professionals alike.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <a 
                    href="mailto:himanshusharma.shriram@gmail.com" 
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-pharma-600 text-white hover:bg-pharma-700 transition-colors"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact via Email
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/himanshu-sharma" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-pharma-600 text-pharma-600 hover:bg-pharma-50 dark:hover:bg-pharma-900/10 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 mr-2" />
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
              
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-pharma-100 dark:border-pharma-900/30 shadow-xl">
                    <img 
                      src="/placeholder.svg" 
                      alt="Himanshu Sharma" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                    <Pill className="h-10 w-10 text-pharma-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-pharma-600 text-white">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Experience PharmaLens?</h2>
            <p className="text-pharma-100 max-w-3xl mx-auto mb-10">
              Start using our powerful medication identification and information tools today. Whether you're a healthcare professional, student, or patient, PharmaLens is here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/identify" className="px-8 py-3 rounded-lg bg-white text-pharma-800 font-medium hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
                Try Visual Identification
              </Link>
              <Link to="/search" className="px-8 py-3 rounded-lg bg-pharma-700 text-white font-medium border border-pharma-500 hover:bg-pharma-800 transition-all shadow-lg hover:shadow-xl">
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
