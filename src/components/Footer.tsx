
import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, Heart, ExternalLink, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group mb-4">
              <div className="h-8 w-8 rounded-full bg-pharma-600 flex items-center justify-center transition-all group-hover:scale-105">
                <span className="text-white font-semibold text-sm">PL</span>
              </div>
              <span className="text-lg font-semibold transition-colors">
                PharmaLens
                <span className="text-pharma-600">.</span>
              </span>
            </Link>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              AI-powered drug identification and comprehensive medication information.
            </p>
            
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              
              <a 
                href="#" 
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              
              <a 
                href="mailto:contact@pharmalens.com" 
                className="text-gray-500 hover:text-pharma-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/search" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Drug Search
                  </Link>
                </li>
                <li>
                  <Link to="/identify" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Visual Identification
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/help" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="text-sm text-gray-600 dark:text-gray-300 hover:text-pharma-600 transition-colors">
                    Medical Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} PharmaLens. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-2">Made with</span>
              <Heart className="h-3 w-3 text-red-500 animate-pulse" />
              <span className="mx-2">for healthcare</span>
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
