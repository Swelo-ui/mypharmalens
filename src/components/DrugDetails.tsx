
import React, { useState } from 'react';
import { 
  Pill, Shield, AlertCircle, History, ThumbsUp, ThumbsDown, 
  Calendar, FileText, Clock, Search, ChevronDown, ChevronUp,
  AlertTriangle, Package, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

const DrugDetails = ({ drug, className }: DrugDetailsProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    dosage: true,
    sideEffects: false,
    warnings: false,
    interactions: false,
    mechanism: false,
  });
  
  const isMobile = useIsMobile();
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <InfoSection
              title="Description"
              expanded={expandedSections.description}
              onToggle={() => toggleSection('description')}
              content={
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {drug.description}
                </p>
              }
            />
            
            <InfoSection
              title="Dosage & Administration"
              expanded={expandedSections.dosage}
              onToggle={() => toggleSection('dosage')}
              content={
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {drug.dosageAndAdmin}
                </p>
              }
            />
            
            <InfoSection
              title="Mechanism of Action"
              expanded={expandedSections.mechanism}
              onToggle={() => toggleSection('mechanism')}
              content={
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {drug.mechanism}
                </p>
              }
            />
            
            <InfoSection
              title="Side Effects"
              expanded={expandedSections.sideEffects}
              onToggle={() => toggleSection('sideEffects')}
              content={
                <ul className="space-y-2">
                  {drug.sideEffects.map((effect, i) => (
                    <li key={i} className="flex items-start">
                      <ThumbsDown className="h-4 w-4 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{effect}</span>
                    </li>
                  ))}
                </ul>
              }
            />
            
            <InfoSection
              title="Warnings & Precautions"
              expanded={expandedSections.warnings}
              onToggle={() => toggleSection('warnings')}
              content={
                <ul className="space-y-2">
                  {drug.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{warning}</span>
                    </li>
                  ))}
                </ul>
              }
            />
            
            <InfoSection
              title="Drug Interactions"
              expanded={expandedSections.interactions}
              onToggle={() => toggleSection('interactions')}
              content={
                <ul className="space-y-2">
                  {drug.interactions.map((interaction, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{interaction}</span>
                    </li>
                  ))}
                </ul>
              }
            />
          </div>
        );
        
      case 'usage':
        return (
          <div className="space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Indications</h3>
              <ul className="space-y-2">
                {drug.indications.map((indication, i) => (
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
                {drug.contraindications.map((contraindication, i) => (
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
                {drug.pregnancy}
              </p>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium mb-3">Storage Information</h3>
              <div className="flex items-start">
                <History className="h-4 w-4 text-pharma-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">{drug.storage}</span>
              </div>
            </div>
          </div>
        );
        
      case 'alternatives':
        return (
          <div className="space-y-4">
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
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Similar medications or alternatives to {drug.name}.
            </p>
            
            {drug.similarDrugs && drug.similarDrugs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {drug.similarDrugs.map((similar) => (
                  <div key={similar.id} className="glass-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-3">
                        <Pill className="h-4 w-4 text-pharma-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{similar.name}</h4>
                        <a 
                          href={`/drug/${similar.id}`} 
                          className="text-xs text-pharma-600 hover:text-pharma-700 transition-colors hover:underline"
                        >
                          View details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No alternatives found for this medication.</p>
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
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className={cn(
          "flex", 
          isMobile ? "flex-col space-y-2" : "space-x-8"
        )}>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "py-3 text-sm font-medium transition-colors border-b-2",
              isMobile ? "" : "-mb-px",
              activeTab === 'general'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            General Information
          </button>
          
          <button
            onClick={() => setActiveTab('usage')}
            className={cn(
              "py-3 text-sm font-medium transition-colors border-b-2",
              isMobile ? "" : "-mb-px",
              activeTab === 'usage'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Usage & Precautions
          </button>
          
          <button
            onClick={() => setActiveTab('alternatives')}
            className={cn(
              "py-3 text-sm font-medium transition-colors border-b-2",
              isMobile ? "" : "-mb-px",
              activeTab === 'alternatives'
                ? "border-pharma-600 text-pharma-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Alternatives & Brands
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

// Helper component for collapsible sections
interface InfoSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  content: React.ReactNode;
}

const InfoSection = ({ title, expanded, onToggle, content }: InfoSectionProps) => {
  return (
    <div className="glass-card overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <h3 className="text-sm font-medium">{title}</h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      <div 
        className={cn(
          "px-4 pb-4 transition-all duration-300",
          expanded ? "block animate-accordion-down" : "hidden animate-accordion-up"
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default DrugDetails;
