
import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ChevronRight, Shield } from 'lucide-react';
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
}

interface DrugCardProps {
  drug: DrugData;
  className?: string;
}

const DrugCard = ({ drug, className }: DrugCardProps) => {
  return (
    <div className={cn(
      "block p-6 rounded-2xl glass-card group transition-all duration-300",
      "hover:shadow-lg hover:scale-[1.01]",
      className
    )}>
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
      
      <h3 className="text-lg font-semibold mb-1 group-hover:text-pharma-600 transition-colors">
        {drug.name}
      </h3>
      
      {drug.genericName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
          {drug.genericName}
        </p>
      )}
      
      {drug.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {drug.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-4">
        {drug.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            {drug.category}
          </span>
        )}
        
        {drug.drugClass && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pharma-50 dark:bg-pharma-900/20 text-pharma-700 dark:text-pharma-300">
            {drug.drugClass}
          </span>
        )}
        
        {drug.manufacturer && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
            {drug.manufacturer}
          </span>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link 
          to={`/drug/${drug.id}`}
          className="text-sm text-pharma-600 font-medium flex items-center hover:underline hover:text-pharma-800 transition-colors w-full py-2"
        >
          View detailed information
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default DrugCard;
