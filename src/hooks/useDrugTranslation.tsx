
import { useLanguage } from '@/contexts/LanguageContext';

// This translation map contains Hindi translations for common drug-related terms
const drugTranslations = {
  // Drug categories
  'Analgesic': 'दर्द निवारक',
  'Antibiotic': 'एंटीबायोटिक',
  'Antidepressant': 'एंटीडिप्रेसेंट',
  'Antidiabetic': 'एंटीडायबेटिक',
  'Antihistamine': 'एंटीहिस्टामाइन',
  'Antihypertensive': 'उच्च रक्तचाप रोधी',
  'Antipyretic': 'बुखार कम करने वाली',
  'Cardiovascular': 'हृदय संबंधी',
  'NSAID': 'एनएसएआईडी',
  'Psychiatric': 'मनोरोग संबंधी',
  'Respiratory': 'श्वसन संबंधी',
  'Vitamin': 'विटामिन',

  // Common side effects
  'Headache': 'सिरदर्द',
  'Nausea': 'मतली',
  'Vomiting': 'उल्टी',
  'Dizziness': 'चक्कर आना',
  'Fatigue': 'थकान',
  'Diarrhea': 'दस्त',
  'Constipation': 'कब्ज',
  'Drowsiness': 'नींद',
  'Insomnia': 'अनिद्रा',
  'Rash': 'चकत्ते',
  'Dry mouth': 'मुंह सूखना',
  'Fever': 'बुखार',
  'Allergic reaction': 'एलर्जी की प्रतिक्रिया',
  
  // Prescription status
  'OTC': 'बिना पर्ची',
  'Prescription Only': 'केवल पर्ची',
  'Controlled': 'नियंत्रित',
  
  // Drug classes
  'Opioid': 'ओपिओइड',
  'Anti-inflammatory': 'सूजन-रोधी',
  'Statin': 'स्टैटिन',
  'ACE inhibitor': 'एसीई इनहिबिटर',
  'Benzodiazepine': 'बेंजोडियाजेपाइन',
  'SSRI': 'एसएसआरआई',
  'Beta-blocker': 'बीटा-ब्लॉकर',
  'Proton Pump Inhibitor': 'प्रोटॉन पंप इनहिबिटर',
  'Calcium channel blocker': 'कैल्शियम चैनल ब्लॉकर',
  'Anticoagulant': 'एंटीकोआगुलेंट',
  'Antiplatelet': 'एंटीप्लेटलेट',
  
  // Common terms
  'Oral': 'मौखिक',
  'Topical': 'स्थानीय',
  'Injection': 'इंजेक्शन',
  'Daily': 'दैनिक',
  'Twice daily': 'दिन में दो बार',
  'As needed': 'जरूरत के अनुसार',
  'Before meals': 'भोजन से पहले',
  'After meals': 'भोजन के बाद',
  'With food': 'भोजन के साथ',
  'Without food': 'भोजन के बिना',
  'Take as directed': 'निर्देशानुसार लें',
};

export const useDrugTranslation = () => {
  const { language } = useLanguage();
  
  // Function to translate drug text
  const translateDrugText = (text: string | null | undefined): string => {
    if (!text) return '';
    if (language === 'en') return text;
    
    // For Hindi translation, check if we have a direct translation
    if (language === 'hi') {
      // Try direct translation first
      if (text in drugTranslations) {
        return drugTranslations[text as keyof typeof drugTranslations];
      }
      
      // For longer texts, we can try to translate known terms within the text
      let translatedText = text;
      Object.entries(drugTranslations).forEach(([en, hi]) => {
        // Use regex to match whole words only to avoid partial replacements
        const regex = new RegExp(`\\b${en}\\b`, 'g');
        translatedText = translatedText.replace(regex, hi);
      });
      
      return translatedText;
    }
    
    return text;
  };
  
  // Function to translate array of strings
  const translateDrugArray = (items: string[] | null | undefined): string[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => translateDrugText(item));
  };
  
  return {
    translateDrugText,
    translateDrugArray
  };
};
