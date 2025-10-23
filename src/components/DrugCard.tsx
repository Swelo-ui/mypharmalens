
import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ChevronRight, Shield, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrugData {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  drugClass?: string;
  verified?: boolean;
  image?: string;
  packageImage?: string;
  brandNames?: string[];
  // Comprehensive pharmaceutical information
  prescriptionStatus?: string;
  dosageAndAdmin?: string;
  mechanism?: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  sideEffects?: string[];
  interactions?: string[];
  pregnancy?: string;
  storage?: string;
  similarDrugs?: {id: string, name: string}[];
  // Layman's explanations for accessibility
  laymanExplanations?: {
    description?: string;           // Simple explanation of what the drug does
    mechanism?: string;            // How it works in simple terms
    indications?: string[];        // What conditions it treats (simple language)
    contraindications?: string[];  // When NOT to use it (simple language)
    sideEffects?: string[];       // Side effects in everyday language
    interactions?: string[];      // Drug interactions explained simply
    dosageAndAdmin?: string;      // How to take it (simplified)
    warnings?: string[];          // Important warnings in plain English
    pregnancy?: string;           // Pregnancy info in simple terms
    storage?: string;             // Storage instructions simplified
  };
}

interface DrugCardProps {
  drug: DrugData;
  className?: string;
  onClick?: () => void;
}

const DrugCard = ({ drug, className, onClick }: DrugCardProps) => {
  return (
    <div 
      className={cn(
        "block p-4 sm:p-6 rounded-2xl glass-card group transition-all duration-300 min-w-0 w-full",
        "hover:shadow-lg hover:scale-[1.01]",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center">
            <Pill className="h-5 w-5 text-pharma-600" />
          </div>
          {drug.verified && (
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs font-medium text-green-600">Verified</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-pharma-600 group-hover:translate-x-1 transition-all" />
      </div>
      
      <h3 className="text-lg font-semibold mb-1 group-hover:text-pharma-600 transition-colors break-words hyphens-auto leading-tight">
        {drug.name}
      </h3>
      
      {drug.genericName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic break-words hyphens-auto leading-relaxed">
          {drug.genericName}
        </p>
      )}
      
      {drug.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 break-words leading-relaxed">
          {drug.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-4">
        {drug.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 break-words max-w-full">
            <span className="truncate">{drug.category}</span>
          </span>
        )}
        
        {drug.drugClass && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pharma-50 dark:bg-pharma-900/20 text-pharma-700 dark:text-pharma-300 break-words max-w-full">
            <span className="truncate">{drug.drugClass}</span>
          </span>
        )}
        
        {drug.manufacturer && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 break-words max-w-full">
            <span className="truncate">{drug.manufacturer}</span>
          </span>
        )}
      </div>
      
      {/* Brand names section */}
      {drug.brandNames && drug.brandNames.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>Brand Names:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {drug.brandNames.map((brand, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 break-words max-w-full"
              >
                <span className="truncate">{brand}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        {!onClick && (
          <Link 
            to={`/drug/${drug.id}`}
            className="text-sm text-pharma-600 font-medium flex items-center hover:underline hover:text-pharma-800 transition-colors w-full py-2"
          >
            View detailed information
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
        {onClick && (
          <div 
            className="text-sm text-pharma-600 font-medium flex items-center hover:underline hover:text-pharma-800 transition-colors w-full py-2"
          >
            View detailed information
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugCard;
