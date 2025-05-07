
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
  
  // Common medicines
  'Paracetamol': 'पैरासिटामोल',
  'Aspirin': 'एस्पिरिन',
  'Ibuprofen': 'आइबुप्रोफेन',
  'Amoxicillin': 'अमॉक्सिसिलिन',
  'Omeprazole': 'ओमेप्राज़ोल',
  'Metformin': 'मेटफॉर्मिन',
  'Atorvastatin': 'अटोरवास्टैटिन',
  'Amlodipine': 'एम्लोडिपीन',
  'Losartan': 'लोसार्टन',
  'Cetirizine': 'सिटरीज़िन',
  'Diazepam': 'डायजेपाम',
  'Fluoxetine': 'फ्लुओक्सेटीन',
  'Levothyroxine': 'लेवोथाइरोक्सिन',
  'Salbutamol': 'सालबुटामोल',
  'Ramipril': 'रैमिप्रिल',
  'Simvastatin': 'सिमवास्टैटिन',
  'Lisinopril': 'लिसिनोप्रिल',
  'Warfarin': 'वारफरिन',
  'Clopidogrel': 'क्लोपिडोग्रेल',

  // Usage and indications
  'For pain relief': 'दर्द से राहत के लिए',
  'For fever': 'बुखार के लिए',
  'For bacterial infections': 'बैक्टीरियल संक्रमण के लिए',
  'For heartburn': 'अपच के लिए',
  'For diabetes': 'मधुमेह के लिए',
  'For high cholesterol': 'उच्च कोलेस्ट्रॉल के लिए',
  'For high blood pressure': 'उच्च रक्तचाप के लिए',
  'For allergies': 'एलर्जी के लिए',
  'For anxiety': 'चिंता के लिए',
  'For depression': 'अवसाद के लिए',
  'For thyroid disorders': 'थायरॉयड विकारों के लिए',
  'For asthma': 'अस्थमा के लिए',
  'For heart failure': 'हृदय विफलता के लिए',
  'For blood thinning': 'रक्त पतला करने के लिए',
  'For inflammation': 'सूजन के लिए',
  
  // Drug identification related
  'Drug details': 'दवा का विवरण',
  'Identified medication': 'पहचानी गई दवा',
  'View details': 'विवरण देखें',
  'More information': 'अधिक जानकारी',
  'Generic name': 'जेनेरिक नाम',
  'Brand name': 'ब्रांड नाम',
  'Manufacturer': 'निर्माता',
  'Usage information': 'उपयोग जानकारी',
  'Safety information': 'सुरक्षा जानकारी',
  'Medication identifier': 'दवा पहचानकर्ता',
  'No results found': 'कोई परिणाम नहीं मिला',
  'Uploading image': 'छवि अपलोड हो रही है',
  'Processing': 'प्रसंस्करण हो रहा है',
  'Take a picture of medication': 'दवा की तस्वीर लें',
  'Upload an image': 'छवि अपलोड करें'
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
  
  // Function to translate object properties recursively
  // Fix: Updated the generic type handling to avoid index assignment errors
  const translateDrugObject = <T extends Record<string, any>>(obj: T | null | undefined): T => {
    if (!obj) return {} as T;
    if (language === 'en') return obj;
    
    // Create a copy of the object that we can safely modify
    const result = { ...obj } as Record<string, any>;
    
    // Process each key in the object
    Object.keys(result).forEach(key => {
      const value = result[key];
      
      if (typeof value === 'string') {
        result[key] = translateDrugText(value);
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        result[key] = translateDrugArray(value);
      } else if (value !== null && typeof value === 'object') {
        result[key] = translateDrugObject(value);
      }
    });
    
    return result as T;
  };
  
  return {
    translateDrugText,
    translateDrugArray,
    translateDrugObject
  };
};
