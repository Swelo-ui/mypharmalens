
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface DrugResult {
  id?: string;
  name: string;
  imprint?: string;
  color?: string;
  shape?: string;
  ndc?: string;
  manufacturer?: string;
  image_url?: string;
  description?: string;
  strength?: string;
  confidence?: number;
}

interface DrugIdentificationResultsProps {
  results: DrugResult[];
}

const DrugIdentificationResults: React.FC<DrugIdentificationResultsProps> = ({ results }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Identification Results</h2>
      {results.map((drug, index) => (
        <Card key={drug.id || index} className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md",
          index === 0 ? "border-pharma-500 dark:border-pharma-400" : ""
        )}>
          <CardHeader className={cn(
            "pb-2",
            index === 0 ? "bg-pharma-50 dark:bg-pharma-900/20" : ""
          )}>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">
                {drug.name}
                {index === 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pharma-100 text-pharma-800 dark:bg-pharma-900 dark:text-pharma-100">
                    Best Match
                  </span>
                )}
              </CardTitle>
              {drug.confidence && (
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  drug.confidence > 0.8 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : drug.confidence > 0.5
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {Math.round(drug.confidence * 100)}% Match
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              {drug.image_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={drug.image_url} 
                    alt={drug.name} 
                    className="w-24 h-24 object-contain rounded-md border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {drug.imprint && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Imprint:</span>
                    <p className="text-sm">{drug.imprint}</p>
                  </div>
                )}
                {drug.color && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Color:</span>
                    <p className="text-sm">{drug.color}</p>
                  </div>
                )}
                {drug.shape && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Shape:</span>
                    <p className="text-sm">{drug.shape}</p>
                  </div>
                )}
                {drug.strength && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Strength:</span>
                    <p className="text-sm">{drug.strength}</p>
                  </div>
                )}
                {drug.manufacturer && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Manufacturer:</span>
                    <p className="text-sm">{drug.manufacturer}</p>
                  </div>
                )}
                {drug.ndc && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">NDC:</span>
                    <p className="text-sm">{drug.ndc}</p>
                  </div>
                )}
              </div>
            </div>
            {drug.description && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</span>
                <p className="text-sm mt-1">{drug.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DrugIdentificationResults;
