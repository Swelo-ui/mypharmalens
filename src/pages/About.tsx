
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Pill, Brain, Camera, Database, Shield, CheckCircle2, Mail, Linkedin, Bookmark, FileText, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { Marquee } from '@/components/ui/marquee';
import { TestimonialCard, pharmaLensTestimonials } from '@/components/ui/testimonial-card';

const About = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const profileImageUrl = "https://res.cloudinary.com/dhf7udqhi/image/upload/v1770364370/WhatsApp_Image_2026-02-06_at_1.21.03_PM_loncdb.jpg";

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    // Add preload link to document head for better caching
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = profileImageUrl;
    preloadLink.crossOrigin = 'anonymous';
    document.head.appendChild(preloadLink);

    // Preload the profile image
    const preloadImage = new Image();
    preloadImage.onload = () => {
      setImageLoaded(true);
    };
    preloadImage.onerror = () => {
      setImageError(true);
    };
    preloadImage.crossOrigin = 'anonymous';
    preloadImage.src = profileImageUrl;

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
  }, [profileImageUrl]);

  // Generate structured data for reviews
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PharmaLens",
    "url": "https://pharmalens.tech",
    "logo": "https://pharmalens.tech/logo.png",
    "sameAs": [
      "https://twitter.com/pharmalens",
      "https://linkedin.com/company/pharmalens"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": pharmaLensTestimonials.map(testimonial => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": testimonial.name,
        "jobTitle": testimonial.role
      },
      "datePublished": "2023-12-01",
      "reviewBody": testimonial.content,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": testimonial.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="About PharmaLens - AI Medication Identification Platform"
        description="Learn about PharmaLens, the AI-powered platform revolutionizing medication identification and drug safety. Trusted by healthcare professionals."
        keywords="about pharmalens, customer reviews, medication ai, drug safety platform, pharmaceutical technology, healthcare innovation"
        canonicalUrl="/about"
        structuredData={reviewSchema}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section - Adjusted top padding */}
        <section className="bg-gradient-to-b from-pharma-50 to-white dark:from-gray-900 dark:to-gray-950 py-24 overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8 animate-fade-up mt-6">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                About PharmaLens
              </h1>
              <div className="w-24 h-1 bg-pharma-500 mx-auto mb-8"></div>
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
        <section id="meet-himanshu" className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-8 order-2 md:order-1 animate-on-scroll">
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

              <div className="md:col-span-4 order-1 md:order-2 flex justify-center animate-on-scroll">
                <Card className="overflow-hidden border-0 shadow-lg max-w-[200px]">
                  <CardContent className="p-0 relative">
                    {!imageLoaded && !imageError && (
                      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-pharma-600" />
                      </div>
                    )}
                    {imageError && (
                      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="text-center text-gray-500">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                          <p className="text-sm">Image unavailable</p>
                        </div>
                      </div>
                    )}
                    <img
                      src={profileImageUrl}
                      alt="Himanshu Sharma"
                      className={`w-full h-auto object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                      style={{
                        maxWidth: "100%",
                        borderRadius: "0.5rem",
                        filter: "contrast(1.05) brightness(1.02)"
                      }}
                      loading="eager"
                      fetchPriority="high"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl mb-10">
            <div className="text-center animate-on-scroll">
              <div className="inline-block mb-3">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 text-pharma-800 dark:bg-pharma-900/30 dark:text-pharma-300">
                  Customer Reviews
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Trusted by healthcare professionals, pharmacy students, and caregivers across India
              </p>
            </div>
          </div>

          {/* First row - scrolling left */}
          <Marquee direction="left" duration={40} repeat={2} pauseOnHover className="mb-6">
            {pharmaLensTestimonials.slice(0, 4).map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </Marquee>

          {/* Second row - scrolling right */}
          <Marquee direction="right" duration={45} repeat={2} pauseOnHover>
            {pharmaLensTestimonials.slice(4, 8).map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </Marquee>

          {/* Trust indicators */}
          <div className="container mx-auto px-4 max-w-6xl mt-10">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span>4.9/5 Average Rating</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
              <span>1,000+ Happy Users</span>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
              <span>Trusted by 50+ Healthcare Institutions</span>
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
