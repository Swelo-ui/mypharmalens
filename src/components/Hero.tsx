
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Hero = () => {
  return (
    <div className="relative pt-12 pb-8 md:pt-16 md:pb-12 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[#FEF6EE] -z-10"></div>
      
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Main Hero Content */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-block mb-3">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-[#0384c6]/10 text-[#0384c6]">
              AI-Powered Drug Identification
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Identify & Learn About
            <span className="block text-[#0384c6]">Any Medication</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-6">
            PharmaLens combines AI technology with comprehensive drug databases to help you identify medications and access reliable information instantly.
          </p>
          
          <div className="flex flex-col space-y-4 max-w-xl mx-auto">
            <Link to="/search" className="px-6 py-3.5 rounded-full bg-[#0384c6] text-white font-medium hover:bg-[#026e9e] transition-all shadow-md text-lg">
              Search Medications
            </Link>
            <Link to="/identify" className="px-6 py-3.5 rounded-full bg-white text-[#0384c6] font-medium border border-gray-200 hover:bg-gray-50 transition-all shadow-sm text-lg">
              Identify with Camera
            </Link>
          </div>
        </div>
        
        {/* Medicine Image */}
        <div className="w-full mt-8 md:mt-12">
          <img 
            src="/lovable-uploads/31357776-60f7-4a71-a2fe-6d192178b5d6.png" 
            alt="Various medications including pills, syrups, and tablets" 
            className="w-full max-w-3xl mx-auto rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
