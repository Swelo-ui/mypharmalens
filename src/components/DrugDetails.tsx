
import React from 'react';
import { 
  AlertCircle,
  Clock,
  Pill,
  Shield,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';
import LanguageBadge from './LanguageBadge';

export interface DetailedDrugData {
  id?: string;
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
  drugClass: string;
  brandNames: string[];
  similarDrugs?: {id: string, name: string}[];
  // Multilingual support properties
  textLanguage?: string | null;
  translatedName?: string | null;
  imprint?: string | null;
  translatedImprint?: string | null;
}

interface DrugDetailsProps {
  drug: DetailedDrugData | null;
}

const DrugDetails: React.FC<DrugDetailsProps> = ({ drug }) => {
  if (!drug) {
    return <p>No drug details available.</p>;
  }

  return (
    <div className="space-y-4">
      {/* General Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Pill className="h-5 w-5 mr-1 text-gray-500" />
          {drug.name}
          {drug.textLanguage && drug.textLanguage.toLowerCase() !== 'english' && (
            <LanguageBadge language={drug.textLanguage} />
          )}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-bold">Generic Name:</span> {drug.genericName}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-bold">Drug Class:</span> {drug.drugClass}
        </p>
        {drug.brandNames && drug.brandNames.length > 0 && (
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-bold">Brand Names:</span> {drug.brandNames.join(', ')}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-bold">Manufacturer:</span> {drug.manufacturer}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-bold">Category:</span> {drug.category}
        </p>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-gray-700 dark:text-gray-300">{drug.description}</p>
      </div>

      {/* Dosage and Administration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Dosage and Administration</h3>
        <p className="text-gray-700 dark:text-gray-300">{drug.dosageAndAdmin}</p>
      </div>

      {/* Side Effects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Side Effects</h3>
        {drug.sideEffects && drug.sideEffects.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {drug.sideEffects.map((sideEffect, index) => (
              <li key={index}>{sideEffect}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No known side effects.</p>
        )}
      </div>

      {/* Warnings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Warnings</h3>
        {drug.warnings && drug.warnings.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {drug.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No specific warnings.</p>
        )}
      </div>

      {/* Interactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Interactions</h3>
        {drug.interactions && drug.interactions.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {drug.interactions.map((interaction, index) => (
              <li key={index}>{interaction}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No known interactions.</p>
        )}
      </div>

      {/* Storage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Storage</h3>
        <p className="text-gray-700 dark:text-gray-300">{drug.storage}</p>
      </div>

       {/* Indications */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Indications</h3>
        {drug.indications && drug.indications.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {drug.indications.map((indication, index) => (
              <li key={index}>{indication}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No known indications.</p>
        )}
      </div>

      {/* Contraindications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Contraindications</h3>
        {drug.contraindications && drug.contraindications.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {drug.contraindications.map((contraindication, index) => (
              <li key={index}>{contraindication}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No known contraindications.</p>
        )}
      </div>

      {/* Pregnancy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Pregnancy and Lactation</h3>
        <p className="text-gray-700 dark:text-gray-300">{drug.pregnancy}</p>
      </div>

      {/* Prescription Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Prescription Status</h3>
        <div className="flex items-center">
          {drug.verified && (
            <Shield className="h-4 w-4 mr-1 text-green-500" />
          )}
          <span className="text-gray-700 dark:text-gray-300">{drug.prescriptionStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default DrugDetails;
