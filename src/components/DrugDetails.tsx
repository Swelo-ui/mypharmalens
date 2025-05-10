
import React from 'react';
import { 
  Pill, Shield, AlertCircle, History, ThumbsUp, ThumbsDown, 
  Clock, Tag, Package, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailedDrugData {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  dosageAndAdmin: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  storage: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  prescriptionStatus: 'OTC' | 'Prescription Only' | 'Controlled';
  pregnancy: string;
  verified: boolean;
  image?: string;
  packageImage?: string;
  drugClass?: string;
  brandNames?: string[];
  similarDrugs?: {
    id: string;
    name: string;
  }[];
}

interface DrugDetailsProps {
  drug: DetailedDrugData;
  className?: string;
  showFullDetails?: boolean;
}

const DrugDetails = ({ drug, className, showFullDetails = false }: DrugDetailsProps) => {
  return (
    <div className={cn("rounded-2xl glass-card p-6", className)}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {drug.verified && (
              <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-600">Verified</span>
              </div>
            )}
            
            <div className="flex items-center bg-pharma-50 dark:bg-pharma-900/20 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-pharma-600 mr-1" />
              <span className="text-xs font-medium text-pharma-600">{drug.prescriptionStatus}</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">{drug.name}</h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            <span className="font-medium">Generic Name:</span> {drug.genericName}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {drug.category}
            </span>
            
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              {drug.manufacturer}
            </span>
            
            {drug.drugClass && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                {drug.drugClass}
              </span>
            )}
          </div>
        </div>
        
        {drug.image && (
          <div className="md:w-1/3 h-48 md:h-56 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={drug.image} 
              alt={drug.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="font-medium text-lg mb-2">Description</h3>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {drug.description}
        </p>
      </div>
      
      {/* Package image section */}
      {drug.packageImage && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-pharma-600" />
            <h3 className="text-sm font-medium">Package Appearance</h3>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img 
              src={drug.packageImage} 
              alt={`${drug.name} package`} 
              className="w-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* Full details - always showing now */}
      <div className="space-y-6 mt-6">
        <div className="glass-card p-4">
          <h3 className="font-medium text-lg mb-3">Dosage & Administration</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {drug.dosageAndAdmin}
          </p>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-medium text-lg mb-3">Mechanism of Action</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {drug.mechanism}
          </p>
        </div>

        {drug.indications && drug.indications.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-medium text-lg mb-3">Indications</h3>
            <ul className="space-y-2">
              {drug.indications.map((indication, i) => (
                <li key={i} className="flex items-start">
                  <ThumbsUp className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{indication}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {drug.sideEffects && drug.sideEffects.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-medium text-lg mb-3">Side Effects</h3>
            <ul className="space-y-2">
              {drug.sideEffects.map((effect, i) => (
                <li key={i} className="flex items-start">
                  <ThumbsDown className="h-4 w-4 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {drug.warnings && drug.warnings.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-medium text-lg mb-3">Warnings & Precautions</h3>
            <ul className="space-y-2">
              {drug.warnings.map((warning, i) => (
                <li key={i} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {drug.contraindications && drug.contraindications.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-medium text-lg mb-3">Contraindications</h3>
            <ul className="space-y-2">
              {drug.contraindications.map((contraindication, i) => (
                <li key={i} className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{contraindication}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {drug.interactions && drug.interactions.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-medium text-lg mb-3">Drug Interactions</h3>
            <ul className="space-y-2">
              {drug.interactions.map((interaction, i) => (
                <li key={i} className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{interaction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="glass-card p-4">
          <h3 className="font-medium text-lg mb-3">Pregnancy & Lactation</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {drug.pregnancy}
          </p>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-medium text-lg mb-3">Storage Information</h3>
          <div className="flex items-start">
            <History className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 text-sm">{drug.storage}</span>
          </div>
        </div>

        {drug.brandNames && drug.brandNames.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3">Brand Names</h3>
            <div className="flex flex-wrap gap-2">
              {drug.brandNames.map((brand, index) => (
                <div key={index} className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-pharma-50 dark:bg-pharma-900/20 text-pharma-600 dark:text-pharma-300 text-xs font-medium">
                  <Tag className="h-3 w-3 mr-1" />
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugDetails;
