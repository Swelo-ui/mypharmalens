
import { Link } from 'react-router-dom';
import { AuroraBackground } from '@/components/ui/aurora-background';
import FlippableFeatureGrid from '@/components/FlippableFeatureCards';

const Hero = () => {
  return (
    <div className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
      {/* Aurora background wrapper with proper children */}
      <AuroraBackground className="absolute inset-0 z-0 h-full" showRadialGradient={true}>
        {/* Empty div as children - the aurora effect will appear behind the content */}
        <div></div>
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
            Identify & Learn About Any Medication with <span className="text-pharma-600">PharmaLens</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-3xl mx-auto mb-6">
            PharmaLens combines AI technology with comprehensive drug databases to help you identify medications and access reliable information instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search" className="px-6 py-2.5 rounded-md bg-pharma-600 text-white font-medium hover:bg-pharma-700 transition-all shadow-md w-full sm:w-auto">
              Search Medications
            </Link>
            <Link to="/identify" className="px-6 py-2.5 rounded-md bg-white text-pharma-800 dark:text-pharma-800 font-medium border border-gray-200 hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto">
              Identify with Camera
            </Link>
          </div>
        </div>

        {/* Features Grid - 4 Flippable Cards */}
        <FlippableFeatureGrid />
      </div>
    </div>
  );
};

export default Hero;
