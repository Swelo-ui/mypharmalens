
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DetailedDrugData } from '@/components/DrugDetails';

/**
 * Hook to handle drug information translation and language detection
 */
export const useDrugTranslation = () => {
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  /**
   * Translate a single text string
   */
  const translateText = async (text: string, targetLang: string = 'en'): Promise<string> => {
    if (!text) return '';
    
    try {
      setIsTranslating(true);
      
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLang }
      });
      
      if (error) throw error;
      
      setIsTranslating(false);
      
      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
      }
      
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      setIsTranslating(false);
      return text;
    }
  };

  /**
   * Translate an array of strings
   */
  const translateArray = async (
    items: string[], 
    targetLang: string = 'en'
  ): Promise<string[]> => {
    if (!items || items.length === 0) return [];
    
    try {
      // Translate each item in the array
      const translatedItems = await Promise.all(
        items.map(item => translateText(item, targetLang))
      );
      
      return translatedItems;
    } catch (error) {
      console.error('Error translating array:', error);
      return items;
    }
  };

  /**
   * Translate a drug object with multiple fields
   */
  const translateDrugObject = async <T extends DetailedDrugData>(
    drug: T, 
    targetLang: string = 'en'
  ): Promise<T> => {
    if (!drug) return drug;
    
    try {
      setIsTranslating(true);
      
      // Create a copy of the drug object to avoid mutating the original
      const translatedDrug = { ...drug } as T;
      
      // Translate text fields
      if (translatedDrug.name && translatedDrug.name !== "Unknown Medication") {
        translatedDrug.name = await translateText(translatedDrug.name, targetLang);
      }
      
      if (translatedDrug.genericName) {
        translatedDrug.genericName = await translateText(translatedDrug.genericName, targetLang);
      }
      
      if (translatedDrug.description) {
        translatedDrug.description = await translateText(translatedDrug.description, targetLang);
      }
      
      if (translatedDrug.dosageAndAdmin) {
        translatedDrug.dosageAndAdmin = await translateText(translatedDrug.dosageAndAdmin, targetLang);
      }
      
      if (translatedDrug.mechanism) {
        translatedDrug.mechanism = await translateText(translatedDrug.mechanism, targetLang);
      }
      
      if (translatedDrug.pregnancy) {
        translatedDrug.pregnancy = await translateText(translatedDrug.pregnancy, targetLang);
      }
      
      if (translatedDrug.storage) {
        translatedDrug.storage = await translateText(translatedDrug.storage, targetLang);
      }
      
      // Translate array fields
      if (translatedDrug.sideEffects && translatedDrug.sideEffects.length > 0) {
        translatedDrug.sideEffects = await translateArray(translatedDrug.sideEffects, targetLang);
      }
      
      if (translatedDrug.warnings && translatedDrug.warnings.length > 0) {
        translatedDrug.warnings = await translateArray(translatedDrug.warnings, targetLang);
      }
      
      if (translatedDrug.interactions && translatedDrug.interactions.length > 0) {
        translatedDrug.interactions = await translateArray(translatedDrug.interactions, targetLang);
      }
      
      if (translatedDrug.indications && translatedDrug.indications.length > 0) {
        translatedDrug.indications = await translateArray(translatedDrug.indications, targetLang);
      }
      
      if (translatedDrug.contraindications && translatedDrug.contraindications.length > 0) {
        translatedDrug.contraindications = await translateArray(translatedDrug.contraindications, targetLang);
      }
      
      setIsTranslating(false);
      return translatedDrug;
    } catch (error) {
      console.error('Error translating drug object:', error);
      setIsTranslating(false);
      return drug;
    }
  };

  return {
    isTranslating,
    detectedLanguage,
    translateText,
    translateArray,
    translateDrugObject
  };
};

export default useDrugTranslation;
