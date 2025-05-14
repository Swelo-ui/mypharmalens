
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add utility function to generate unique IDs
export function generateUniqueId(prefix = 'drug_'): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

// Add utility function to format dosage information
export function formatDosage(dosage: string): string {
  return dosage || "Take as directed by your healthcare provider. Dosing may vary based on individual needs and medical condition.";
}
