
import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ExternalLink, Mail, Linkedin, Youtube, MapPin } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';
import { LikeButton } from '@/components/ui/like-button';

const Footer = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 mt-8 sm:mt-12 py-8 sm:py-12 px-3 sm:px-4 ${isMobile ? 'pb-20 sm:pb-24' : ''}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group mb-3 sm:mb-4">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-pharma-600 flex items-center justify-center transition-all group-hover:scale-105">
                <span className="text-white font-semibold text-xs sm:text-sm">PL</span>
              </div>
              <span className="text-base sm:text-lg font-semibold transition-colors">
                PharmaLens
                <span className="text-pharma-600">.</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-5 leading-relaxed">
              AI-powered drug identification and comprehensive medication information.
            </p>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <a
                href="https://share.google/8JXgREohI4JBFRCq4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="Google Business Profile"
              >
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>

              <a
                href="https://www.linkedin.com/in/himanshu-sharma-374421326"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>

              <a
                href="https://youtube.com/@my-pharmalens?si=EmFuIPaN6in9HUXm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>

              <a
                href="mailto:himanshusharma.shriram@gmail.com"
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-6 md:mt-0">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/search" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Drug Search
                  </Link>
                </li>
                <li>
                  <Link to="/drugs" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    A-Z Drug Directory
                  </Link>
                </li>
                <li>
                  <Link to="/identify" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Visual Identification
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/subscription" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Pricing Plans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/help" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Legal</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/privacy" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Medical Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} PharmaLens™. All rights reserved.
          </p>

          <div className="mt-4 md:mt-0 flex items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-1">Made with</span>
              <LikeButton className="mx-1" iconCount={12} />
              <span className="ml-1">for healthcare</span>
            </p>

            <a
              href="https://www.drugs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-xs text-pharma-600 hover:text-pharma-700 transition-colors flex items-center"
            >
              Data Source <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
