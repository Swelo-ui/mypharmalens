
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

type TranslationKey = 
  | 'common.search'
  | 'common.identify'
  | 'common.history'
  | 'common.profile'
  | 'common.home'
  | 'common.login'
  | 'common.logout'
  | 'common.save'
  | 'common.cancel'
  | 'common.email'
  | 'common.password'
  | 'common.signUp'
  | 'common.signIn'
  | 'common.or'
  | 'profile.title'
  | 'profile.settings'
  | 'profile.displayName'
  | 'profile.language'
  | 'profile.english'
  | 'profile.hindi'
  | 'profile.selectLanguage'
  | 'profile.saveChanges'
  | 'profile.securitySettings'
  | 'profile.changePassword'
  | 'profile.currentPassword'
  | 'profile.newPassword'
  | 'profile.confirmPassword'
  | 'profile.profileInfo'
  | 'profile.security'
  | 'profile.updateSuccess'
  | 'profile.updateFailed'
  | 'profile.passwordNotMatch'
  | 'profile.passwordTooShort'
  | 'profile.passwordUpdated'
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.searchBtn'
  | 'hero.identifyBtn'
  | 'hero.feature1Title'
  | 'hero.feature1Desc'
  | 'hero.feature2Title'
  | 'hero.feature2Desc'
  | 'hero.feature3Title'
  | 'hero.feature3Desc'
  | 'hero.feature4Title'
  | 'hero.feature4Desc'
  | 'drug.usage'
  | 'drug.sideEffects'
  | 'drug.prescriptionStatus'
  | 'drug.dosage'
  | 'drug.class'
  | 'drug.brandNames'
  | 'drug.similarDrugs'
  | 'drug.saveToHistory'
  | 'drug.savedToHistory'
  | 'drug.failedToSave'
  | 'identify.title'
  | 'identify.uploadImage'
  | 'identify.takePhoto'
  | 'identify.processingImage'
  | 'identify.identifyingDrug'
  | 'identify.identificationFailed'
  | 'identify.tryAgain'
  | 'history.title'
  | 'history.empty'
  | 'history.delete'
  | 'history.viewDetails'
  | 'history.identifiedOn'
  | 'history.searchMedications'
  | 'history.noResults'
  | 'history.tryDifferentSearch'
  | 'history.identifyMedication'
  | 'history.deleteConfirm'
  | 'history.deleteConfirmMessage'
  | 'history.cancelDelete'
  | 'history.confirmDelete'
  | 'history.deleting'
  | 'history.previousMedications'
  | 'error.authRequired'
  | 'error.loginRequired'
  | 'error.goToLogin';

// Define translations
const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'common.search': 'Search',
    'common.identify': 'Identify',
    'common.history': 'History',
    'common.profile': 'Profile',
    'common.home': 'Home',
    'common.login': 'Login',
    'common.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.email': 'Email',
    'common.password': 'Password',
    'common.signUp': 'Sign Up',
    'common.signIn': 'Sign In',
    'common.or': 'Or',
    'profile.title': 'Profile Settings',
    'profile.settings': 'Settings',
    'profile.displayName': 'Display Name',
    'profile.language': 'Language',
    'profile.english': 'English',
    'profile.hindi': 'Hindi',
    'profile.selectLanguage': 'Select Language',
    'profile.saveChanges': 'Save Changes',
    'profile.securitySettings': 'Security Settings',
    'profile.changePassword': 'Change Password',
    'profile.currentPassword': 'Current Password',
    'profile.newPassword': 'New Password',
    'profile.confirmPassword': 'Confirm New Password',
    'profile.profileInfo': 'Profile Information',
    'profile.security': 'Security',
    'profile.updateSuccess': 'Profile updated successfully',
    'profile.updateFailed': 'Failed to update profile',
    'profile.passwordNotMatch': 'Passwords don\'t match',
    'profile.passwordTooShort': 'Password must be at least 6 characters',
    'profile.passwordUpdated': 'Password updated successfully',
    'hero.title': 'Identify & Learn About Any Medication',
    'hero.subtitle': 'PharmaLens combines AI technology with comprehensive drug databases to help you identify medications and access reliable information instantly.',
    'hero.searchBtn': 'Search Medications',
    'hero.identifyBtn': 'Identify with Camera',
    'hero.feature1Title': 'Drug Information',
    'hero.feature1Desc': 'Access comprehensive drug data including uses, dosages, side effects, and precautions.',
    'hero.feature2Title': 'Visual Identification',
    'hero.feature2Desc': 'Upload an image of any medication to identify it with our AI-powered recognition system.',
    'hero.feature3Title': 'Smart Search',
    'hero.feature3Desc': 'Find medications by name, category, manufacturer, or conditions they treat.',
    'hero.feature4Title': 'Educational Resources',
    'hero.feature4Desc': 'Access medication guides and educational content to better understand your prescriptions.',
    'drug.usage': 'Usage',
    'drug.sideEffects': 'Side Effects',
    'drug.prescriptionStatus': 'Prescription Status',
    'drug.dosage': 'Dosage & Administration',
    'drug.class': 'Drug Class',
    'drug.brandNames': 'Brand Names',
    'drug.similarDrugs': 'Similar Drugs',
    'drug.saveToHistory': 'Save to History',
    'drug.savedToHistory': 'Saved to history',
    'drug.failedToSave': 'Failed to save',
    'identify.title': 'Identify Medication',
    'identify.uploadImage': 'Upload Image',
    'identify.takePhoto': 'Take Photo',
    'identify.processingImage': 'Processing image...',
    'identify.identifyingDrug': 'Identifying drug...',
    'identify.identificationFailed': 'Identification failed',
    'identify.tryAgain': 'Try again',
    'history.title': 'Identification History',
    'history.empty': 'No identification history',
    'history.delete': 'Delete',
    'history.viewDetails': 'View Details',
    'history.identifiedOn': 'Identified on',
    'history.searchMedications': 'Search medications...',
    'history.noResults': 'No results match your search criteria',
    'history.tryDifferentSearch': 'Try a different search term',
    'history.identifyMedication': 'Identify a Medication',
    'history.deleteConfirm': 'Are you sure?',
    'history.deleteConfirmMessage': 'This will permanently delete this medication record from your history. This action cannot be undone.',
    'history.cancelDelete': 'Cancel',
    'history.confirmDelete': 'Delete',
    'history.deleting': 'Deleting',
    'history.previousMedications': 'View your previous medication identifications',
    'error.authRequired': 'Authentication Required',
    'error.loginRequired': 'Please log in to view this page',
    'error.goToLogin': 'Go to Login'
  },
  hi: {
    'common.search': 'खोज',
    'common.identify': 'पहचानें',
    'common.history': 'इतिहास',
    'common.profile': 'प्रोफाइल',
    'common.home': 'होम',
    'common.login': 'लॉगिन',
    'common.logout': 'लॉग आउट',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.email': 'ईमेल',
    'common.password': 'पासवर्ड',
    'common.signUp': 'साइन अप करें',
    'common.signIn': 'साइन इन करें',
    'common.or': 'या',
    'profile.title': 'प्रोफाइल सेटिंग्स',
    'profile.settings': 'सेटिंग्स',
    'profile.displayName': 'प्रदर्शन नाम',
    'profile.language': 'भाषा',
    'profile.english': 'अंग्रेज़ी',
    'profile.hindi': 'हिंदी',
    'profile.selectLanguage': 'भाषा चुनें',
    'profile.saveChanges': 'परिवर्तन सहेजें',
    'profile.securitySettings': 'सुरक्षा सेटिंग्स',
    'profile.changePassword': 'पासवर्ड बदलें',
    'profile.currentPassword': 'वर्तमान पासवर्ड',
    'profile.newPassword': 'नया पासवर्ड',
    'profile.confirmPassword': 'नए पासवर्ड की पुष्टि करें',
    'profile.profileInfo': 'प्रोफाइल जानकारी',
    'profile.security': 'सुरक्षा',
    'profile.updateSuccess': 'प्रोफाइल सफलतापूर्वक अपडेट की गई',
    'profile.updateFailed': 'प्रोफाइल अपडेट करने में विफल',
    'profile.passwordNotMatch': 'पासवर्ड मेल नहीं खाते',
    'profile.passwordTooShort': 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
    'profile.passwordUpdated': 'पासवर्ड सफलतापूर्वक अपडेट किया गया',
    'hero.title': 'किसी भी दवा की पहचान और जानकारी प्राप्त करें',
    'hero.subtitle': 'PharmaLens एआई तकनीक को व्यापक दवा डेटाबेस के साथ जोड़कर आपको दवाओं की पहचान करने और तुरंत विश्वसनीय जानकारी प्राप्त करने में मदद करता है।',
    'hero.searchBtn': 'दवाएं खोजें',
    'hero.identifyBtn': 'कैमरे से पहचानें',
    'hero.feature1Title': 'दवा की जानकारी',
    'hero.feature1Desc': 'उपयोग, खुराक, दुष्प्रभाव और सावधानियों सहित व्यापक दवा डेटा तक पहुंच प्राप्त करें।',
    'hero.feature2Title': 'दृश्य पहचान',
    'hero.feature2Desc': 'हमारी एआई-संचालित पहचान प्रणाली के साथ पहचानने के लिए किसी भी दवा की छवि अपलोड करें।',
    'hero.feature3Title': 'स्मार्ट खोज',
    'hero.feature3Desc': 'दवाओं को नाम, श्रेणी, निर्माता, या जिन स्थितियों का उपचार करते हैं, से खोजें।',
    'hero.feature4Title': 'शैक्षिक संसाधन',
    'hero.feature4Desc': 'अपने निर्देशों को बेहतर ढंग से समझने के लिए दवा गाइड और शैक्षिक सामग्री तक पहुंच प्राप्त करें।',
    'drug.usage': 'उपयोग',
    'drug.sideEffects': 'दुष्प्रभाव',
    'drug.prescriptionStatus': 'नुस्खे की स्थिति',
    'drug.dosage': 'खुराक और प्रशासन',
    'drug.class': 'दवा वर्ग',
    'drug.brandNames': 'ब्रांड नाम',
    'drug.similarDrugs': 'समान दवाएं',
    'drug.saveToHistory': 'इतिहास में सहेजें',
    'drug.savedToHistory': 'इतिहास में सहेजा गया',
    'drug.failedToSave': 'सहेजने में विफल',
    'identify.title': 'दवा की पहचान करें',
    'identify.uploadImage': 'छवि अपलोड करें',
    'identify.takePhoto': 'फोटो लें',
    'identify.processingImage': 'छवि प्रसंस्करण हो रहा है...',
    'identify.identifyingDrug': 'दवा की पहचान की जा रही है...',
    'identify.identificationFailed': 'पहचान विफल रही',
    'identify.tryAgain': 'पुनः प्रयास करें',
    'history.title': 'पहचान इतिहास',
    'history.empty': 'कोई पहचान इतिहास नहीं',
    'history.delete': 'हटाएं',
    'history.viewDetails': 'विवरण देखें',
    'history.identifiedOn': 'पहचाना गया',
    'history.searchMedications': 'दवाएं खोजें...',
    'history.noResults': 'आपके खोज मानदंड से कोई परिणाम मेल नहीं खाते',
    'history.tryDifferentSearch': 'कोई अलग खोज शब्द आज़माएं',
    'history.identifyMedication': 'एक दवा की पहचान करें',
    'history.deleteConfirm': 'क्या आप सुनिश्चित हैं?',
    'history.deleteConfirmMessage': 'यह आपके इतिहास से इस दवा के रिकॉर्ड को स्थायी रूप से हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।',
    'history.cancelDelete': 'रद्द करें',
    'history.confirmDelete': 'हटाएं',
    'history.deleting': 'हटाया जा रहा है',
    'history.previousMedications': 'अपनी पिछली दवा पहचानें देखें',
    'error.authRequired': 'प्रमाणीकरण आवश्यक',
    'error.loginRequired': 'इस पृष्ठ को देखने के लिए कृपया लॉग इन करें',
    'error.goToLogin': 'लॉगिन पर जाएँ'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use localStorage to remember user's language preference
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage === 'hi' ? 'hi' : 'en') as Language;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Optional: set html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const translate = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};
