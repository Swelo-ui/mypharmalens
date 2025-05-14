
import { DrugData } from "@/components/DrugCard";
import { DetailedDrugData as DrugDetailsInterface } from "@/components/DrugDetails";
import { combinedDrugsData } from "./combinedDrugsData";
import { getDetailedDrugData } from "./drugDataUtils";

// Export interface from the existing file (not changing this)
export interface DetailedDrugData {
  id: string;
  name: string;
  genericName: string; 
  manufacturer: string;
  category: string;
  description: string;
  drugClass?: string;
  verified: boolean; // Changed from optional to required to match DrugDetails.tsx
  prescriptionStatus: 'OTC' | 'Prescription Only' | 'Controlled'; // Union type to match DrugDetails.tsx
  dosageAndAdmin: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  warnings: string[];
  sideEffects: string[];
  interactions: string[];
  pregnancy: string;
  storage: string;
  image?: string;
  packageImage?: string;
  brandNames?: string[];
  similarDrugs?: {id: string, name: string}[];
}

// Now exporting from combinedDrugsData
export { combinedDrugsData, getDetailedDrugData };

// Original mockDrugsData array is now imported from the category files and combined in combinedDrugsData.ts
export const mockDrugsData = combinedDrugsData.slice(0, 90);
