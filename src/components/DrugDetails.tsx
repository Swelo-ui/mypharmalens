import React, { useState } from 'react';
import {
  Pill, Shield, AlertCircle, History, ThumbsUp, ThumbsDown,
  Calendar, FileText, Clock, Search,
  AlertTriangle, Package, Tag, BookOpen, GraduationCap,
  Info,
  ToggleLeft,
  ToggleRight
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
  prescriptionStatus: string;
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
  laymanExplanations?: {
    description?: string;
    mechanism?: string;
    indications?: string[];
    contraindications?: string[];
    sideEffects?: string[];
    interactions?: string[];
    dosageAndAdmin?: string;
    warnings?: string[];
    pregnancy?: string;
    storage?: string;
  };
  // Additional optional fields for enhanced identification
  imprint?: string;
  color?: string;
  shape?: string;
  possibleNames?: string[];
  recommendations?: string[];
  janaushadhiAlternative?: {
    found: boolean;
    drugCode?: string;
    genericName?: string;
    mrp?: number;
    savings?: string;
    advice?: string;
    category?: string;
    strength?: string;
    formulation?: string;
  };
}

interface DrugDetailsProps {
  drug: DetailedDrugData;
  className?: string;
}


const DrugDetails = ({ drug, className }: DrugDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'usage' | 'alternatives'>('general');
  const [showLaymanTerms, setShowLaymanTerms] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {showLaymanTerms && drug.laymanExplanations?.description
                  ? drug.laymanExplanations.description
                  : drug.description}
              </p>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Dosage & Administration</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {showLaymanTerms && drug.laymanExplanations?.dosageAndAdmin
                  ? drug.laymanExplanations.dosageAndAdmin
                  : drug.dosageAndAdmin}
              </p>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Mechanism of Action</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {showLaymanTerms && drug.laymanExplanations?.mechanism
                  ? drug.laymanExplanations.mechanism
                  : drug.mechanism}
              </p>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Side Effects</h3>
              <ul className="space-y-2">
                {((showLaymanTerms && drug.laymanExplanations?.sideEffects
                  ? drug.laymanExplanations.sideEffects
                  : drug.sideEffects) ?? []).map((effect, i) => (
                    <li key={i} className="flex items-start">
                      <ThumbsDown className="h-4 w-4 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{effect}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Warnings & Precautions</h3>
              <ul className="space-y-2">
                {((showLaymanTerms && drug.laymanExplanations?.warnings
                  ? drug.laymanExplanations.warnings
                  : drug.warnings) ?? []).map((warning, i) => (
                    <li key={i} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{warning}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Drug Interactions</h3>
              <ul className="space-y-2">
                {((showLaymanTerms && drug.laymanExplanations?.interactions
                  ? drug.laymanExplanations.interactions
                  : drug.interactions) ?? []).map((interaction, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{interaction}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Indications</h3>
              <ul className="space-y-2">
                {((showLaymanTerms && drug.laymanExplanations?.indications
                  ? drug.laymanExplanations.indications
                  : drug.indications) ?? []).map((indication, i) => (
                    <li key={i} className="flex items-start">
                      <ThumbsUp className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{indication}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Contraindications</h3>
              <ul className="space-y-2">
                {((showLaymanTerms && drug.laymanExplanations?.contraindications
                  ? drug.laymanExplanations.contraindications
                  : drug.contraindications) ?? []).map((contraindication, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{contraindication}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Pregnancy & Lactation</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {showLaymanTerms && drug.laymanExplanations?.pregnancy
                  ? drug.laymanExplanations.pregnancy
                  : drug.pregnancy}
              </p>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Storage Information</h3>
              <div className="flex items-start">
                <History className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {showLaymanTerms && drug.laymanExplanations?.storage
                    ? drug.laymanExplanations.storage
                    : drug.storage}
                </span>
              </div>
            </div>
          </div>
        );

      case 'alternatives':
        return (
          <div className="space-y-4">
            {/* Janaushadhi Section - Always Visible */}
            {drug.janaushadhiAlternative && (
              <div className={cn(
                "rounded-xl border mb-6 transition-all overflow-hidden",
                drug.janaushadhiAlternative.found
                  ? "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              )}>
                {drug.janaushadhiAlternative.found ? (
                  <div className="p-4">
                    {/* Header with Badge and Code */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-lg text-rose-700 dark:text-rose-400 shadow-sm">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-rose-900 dark:text-rose-300 text-sm">Janaushadhi Generic</h4>
                          <span className="inline-flex items-center text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 font-semibold bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full mt-1">
                            Govt. Initiative
                          </span>
                        </div>
                      </div>
                      
                      {drug.janaushadhiAlternative.drugCode && (
                        <div className="text-right bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-md border border-rose-100 dark:border-rose-900/30 flex-shrink-0">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold block">PMBJP Code</span>
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {drug.janaushadhiAlternative.drugCode}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Generic Name */}
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Generic Name</h5>
                      <p className="font-semibold text-gray-900 dark:text-white text-base leading-snug break-words">
                        {drug.janaushadhiAlternative.genericName}
                      </p>
                      {(drug.janaushadhiAlternative.strength || drug.janaushadhiAlternative.formulation) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           {drug.janaushadhiAlternative.strength && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/70 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/60">
                               {drug.janaushadhiAlternative.strength}
                             </span>
                           )}
                           {drug.janaushadhiAlternative.formulation && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/70 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/60">
                               {drug.janaushadhiAlternative.formulation}
                             </span>
                           )}
                        </div>
                      )}
                    </div>

                    {/* Price and Action */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-white dark:bg-gray-800/60 rounded-xl p-3.5 border border-rose-100 dark:border-rose-900/30 shadow-sm">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Estimated Price (MRP)</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-rose-700 dark:text-rose-400 leading-none">
                            {drug.janaushadhiAlternative.mrp && drug.janaushadhiAlternative.mrp > 0 
                              ? `₹${Number(drug.janaushadhiAlternative.mrp).toFixed(2)}` 
                              : 'Price varies'}
                          </span>
                          {drug.janaushadhiAlternative.savings && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                              Save {drug.janaushadhiAlternative.savings}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <a 
                        href="https://janaushadhi.gov.in/near-by-kendra" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                      >
                        Locate Store <Search className="h-4 w-4" />
                      </a>
                    </div>
                    
                    {/* Advice / Footer */}
                    {drug.janaushadhiAlternative.advice && (
                        <div className="mt-3 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 bg-rose-100/50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/10">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
                            <p className="leading-relaxed">{drug.janaushadhiAlternative.advice}</p>
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 flex items-start gap-3">
                     <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <Info className="h-5 w-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Janaushadhi Status
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No direct match found in the Pradhan Mantri Bhartiya Janaushadhi Pariyojana database.
                          <br />
                          <span className="text-xs mt-1 block opacity-80">You can still ask for generic equivalents at your local pharmacy.</span>
                        </p>
                     </div>
                  </div>
                )}
              </div>
            )}

            {drug.brandNames && drug.brandNames.length > 0 ? (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium mb-3">Popular Brand Names</h3>
                <div className="flex flex-wrap gap-2">
                  {(drug.brandNames ?? []).map((brand, index) => (
                    <div key={index} className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-pharma-50 dark:bg-pharma-900/20 text-pharma-600 dark:text-pharma-300 text-xs font-medium">
                      <Tag className="h-3 w-3 mr-1" />
                      {brand}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                 <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                 <p className="text-gray-600 dark:text-gray-400">No popular brand names found for this medication.</p>
              </div>
            )}
          </div>

        );


      default:
        return null;
    }
  };

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
              <span className={cn(
                "text-xs font-medium",
                drug.prescriptionStatus === 'Non-pharmaceutical product'
                  ? "text-orange-600"
                  : "text-pharma-600"
              )}>
                {drug.prescriptionStatus}
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1 break-words overflow-wrap-anywhere leading-tight">{drug.name}</h2>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            <span className="font-medium">Generic Name:</span> {drug.genericName}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {drug.category}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pharma-50 dark:bg-pharma-900/20 text-pharma-700 dark:text-pharma-300">
              {drug.manufacturer}
            </span>
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

      {/* Language Toggle and Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          {/* Language Toggle */}
          {drug.laymanExplanations && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setShowLaymanTerms(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  !showLaymanTerms
                    ? "bg-white dark:bg-gray-700 text-pharma-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <GraduationCap className="h-4 w-4" />
                Professional
              </button>
              <button
                onClick={() => setShowLaymanTerms(true)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  showLaymanTerms
                    ? "bg-white dark:bg-gray-700 text-pharma-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <BookOpen className="h-4 w-4" />
                Simple Terms
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full justify-between">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px text-center",
              activeTab === 'general'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            General<br />Information
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px text-center",
              activeTab === 'usage'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Usage &<br />Precautions
          </button>

          <button
            onClick={() => setActiveTab('alternatives')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px text-center",
              activeTab === 'alternatives'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Alternatives<br />& Brands
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Helper component for non-collapsible sections
interface InfoSectionProps {
  title: string;
  content: React.ReactNode;
}

const InfoSection = ({ title, content }: InfoSectionProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
        {content}
      </div>
    </div>
  );
};

export default DrugDetails;
