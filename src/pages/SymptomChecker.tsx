import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Pill, ChevronDown, ChevronRight, ArrowRight, Filter, Eye, X, Stethoscope, Mic } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import DrugCard from '@/components/DrugCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { symptoms, symptomCategories, Symptom } from '@/utils/symptomMapping';
import { loadAllDrugs } from '@/data/drugDataLoader';
import { DrugData } from '@/components/DrugCard';
import { toast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onsoundend?: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
};

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const SymptomChecker = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [matchedDrugs, setMatchedDrugs] = useState<DrugData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allDrugs, setAllDrugs] = useState<DrugData[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewingSymptom, setViewingSymptom] = useState<Symptom | null>(null);
  const [symptomDrugs, setSymptomDrugs] = useState<DrugData[]>([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);
  }, []);

  // Compute per-symptom priority weights for first-line classes and key generics
  const getSymptomPriorityWeights = (syms: Symptom[]) => {
    const classWeights: Record<string, number> = {};
    const nameWeights: Record<string, number> = {};
    const negativeClassWeights: Record<string, number> = {};
    const negativeNameWeights: Record<string, number> = {};

    const addClass = (cls: string, w: number) => {
      const k = cls.toLowerCase();
      classWeights[k] = Math.max(classWeights[k] || 0, w);
    };
    const addName = (nm: string, w: number) => {
      const k = nm.toLowerCase();
      nameWeights[k] = Math.max(nameWeights[k] || 0, w);
    };
    const addNegClass = (cls: string, w: number) => {
      const k = cls.toLowerCase();
      negativeClassWeights[k] = Math.min(negativeClassWeights[k] || 0, -Math.abs(w));
    };
    const addNegName = (nm: string, w: number) => {
      const k = nm.toLowerCase();
      negativeNameWeights[k] = Math.min(negativeNameWeights[k] || 0, -Math.abs(w));
    };

    syms.forEach(s => {
      const name = s.nameEn.toLowerCase();

      // HEAD & MIND
      if (name.includes('headache')) {
        addClass('nsaid', 60); addClass('anti-inflammatory', 30); addClass('analgesic', 20); addClass('triptan', 50);
        ['ibuprofen', 'naproxen', 'diclofenac', 'paracetamol', 'acetaminophen', 'sumatriptan', 'rizatriptan'].forEach(n => addName(n, 40));
        addNegClass('opioid', 60); addNegName('tramadol', 60); addNegClass('topical', 30);
      }
      if (name.includes('anxiety') || name.includes('nervous')) {
        addClass('benzodiazepine', 60); addClass('ssri', 25); addClass('anxiolytic', 60);
        ['alprazolam', 'lorazepam', 'clonazepam', 'diazepam'].forEach(n => addName(n, 40));
        ['sertraline', 'paroxetine', 'fluoxetine', 'escitalopram'].forEach(n => addName(n, 25));
        addNegClass('antihistamine', 20);
      }
      if (name.includes('insomnia') || name.includes('sleep')) {
        addClass('sedative', 50); addClass('hypnotic', 50); addClass('benzodiazepine', 30);
        ['zolpidem', 'eszopiclone', 'melatonin', 'doxepin'].forEach(n => addName(n, 35));
      }
      if (name.includes('dizz')) {
        addClass('antihistamine', 40); addClass('antivertigo', 50);
        ['meclizine', 'betahistine', 'dimenhydrinate'].forEach(n => addName(n, 35));
      }

      // FEVER & GENERAL
      if (name.includes('fever')) {
        addClass('antipyretic', 60); addClass('analgesic', 30);
        ['paracetamol', 'acetaminophen', 'ibuprofen'].forEach(n => addName(n, 40));
      }
      if (name.includes('body ache') || name.includes('myalgia')) {
        addClass('analgesic', 50); addClass('nsaid', 50); addClass('muscle relaxant', 30);
        ['ibuprofen', 'paracetamol', 'diclofenac', 'cyclobenzaprine'].forEach(n => addName(n, 35));
      }
      if (name.includes('tired') || name.includes('fatigue') || name.includes('weak')) {
        addClass('multivitamin', 40); addClass('iron supplement', 40); addClass('vitamin b', 30);
        ['ferrous', 'folic', 'vitamin b12', 'multivitamin'].forEach(n => addName(n, 30));
      }

      // DIGESTIVE
      if (name.includes('stomach pain') || name.includes('abdominal')) {
        addClass('antacid', 40); addClass('antispasmodic', 50); addClass('ppi', 35);
        ['omeprazole', 'pantoprazole', 'dicyclomine', 'hyoscine'].forEach(n => addName(n, 35));
      }
      if (name.includes('acid') || name.includes('heartburn') || name.includes('gerd')) {
        addClass('ppi', 60); addClass('h2 blocker', 40); addClass('antacid', 30);
        ['omeprazole', 'pantoprazole', 'esomeprazole', 'ranitidine', 'famotidine'].forEach(n => addName(n, 40));
      }
      if (name.includes('nausea') || name.includes('vomit')) {
        addClass('antiemetic', 60); addClass('prokinetic', 40);
        ['ondansetron', 'metoclopramide', 'domperidone'].forEach(n => addName(n, 40));
      }
      if (name.includes('diarrhea') || name.includes('loose')) {
        addClass('antidiarrheal', 60); addClass('probiotic', 35);
        ['loperamide', 'racecadotril', 'saccharomyces'].forEach(n => addName(n, 40));
        addNegClass('laxative', 50);
      }
      if (name.includes('constipation')) {
        addClass('laxative', 60); addClass('stool softener', 40);
        ['lactulose', 'bisacodyl', 'docusate', 'psyllium'].forEach(n => addName(n, 40));
        addNegClass('antidiarrheal', 50);
      }
      if (name.includes('gas') || name.includes('bloat')) {
        addClass('antiflatulent', 60); addClass('carminative', 40);
        ['simethicone', 'activated charcoal'].forEach(n => addName(n, 40));
      }

      // RESPIRATORY
      if (name.includes('cough')) {
        addClass('antitussive', 50); addClass('expectorant', 40); addClass('mucolytic', 35);
        ['dextromethorphan', 'guaifenesin', 'ambroxol', 'bromhexine'].forEach(n => addName(n, 35));
      }
      if (name.includes('cold') || name.includes('nasal')) {
        addClass('decongestant', 50); addClass('antihistamine', 40);
        ['pseudoephedrine', 'cetirizine', 'loratadine', 'phenylephrine'].forEach(n => addName(n, 35));
      }
      if (name.includes('breathless') || name.includes('asthma')) {
        addClass('bronchodilator', 60); addClass('corticosteroid', 40);
        ['salbutamol', 'albuterol', 'budesonide', 'fluticasone'].forEach(n => addName(n, 40));
      }

      // SKIN & INFECTIONS
      if (name.includes('itch') || name.includes('allergy')) {
        addClass('antihistamine', 60); addClass('corticosteroid', 35);
        ['cetirizine', 'loratadine', 'fexofenadine', 'hydrocortisone'].forEach(n => addName(n, 40));
      }
      if (name.includes('rash') || name.includes('acne') || name.includes('pimple')) {
        addClass('antibiotic', 40); addClass('retinoid', 35); addClass('corticosteroid', 30);
        ['clindamycin', 'benzoyl peroxide', 'tretinoin', 'adapalene'].forEach(n => addName(n, 30));
      }
      if (name.includes('swell') || name.includes('inflam')) {
        addClass('anti-inflammatory', 50); addClass('nsaid', 50); addClass('corticosteroid', 35);
        ['ibuprofen', 'diclofenac', 'prednisolone'].forEach(n => addName(n, 35));
      }

      // JOINTS & MUSCLES
      if (name.includes('joint') || name.includes('arthritis') || name.includes('knee') || name.includes('back pain')) {
        addClass('nsaid', 60); addClass('analgesic', 40); addClass('muscle relaxant', 30);
        ['ibuprofen', 'diclofenac', 'naproxen', 'etoricoxib', 'cyclobenzaprine'].forEach(n => addName(n, 40));
        addNegClass('opioid', 30);
      }
      if (name.includes('muscle cramp') || name.includes('spasm')) {
        addClass('muscle relaxant', 60); addClass('magnesium', 40);
        ['cyclobenzaprine', 'methocarbamol', 'magnesium'].forEach(n => addName(n, 40));
      }

      // ENT
      if (name.includes('sore throat') || name.includes('throat')) {
        addClass('analgesic', 50); addClass('antiseptic', 40); addClass('antibiotic', 30);
        ['benzocaine', 'chlorhexidine', 'amoxicillin', 'azithromycin'].forEach(n => addName(n, 30));
      }
      if (name.includes('ear pain') || name.includes('ear')) {
        addClass('analgesic', 50); addClass('antibiotic', 40);
        ['ibuprofen', 'paracetamol', 'ciprofloxacin'].forEach(n => addName(n, 35));
      }

      // DENTAL & ORAL
      if (name.includes('tooth') || name.includes('dental')) {
        addClass('analgesic', 50); addClass('antibiotic', 40); addClass('local anesthetic', 30);
        ['ibuprofen', 'paracetamol', 'amoxicillin', 'clindamycin'].forEach(n => addName(n, 35));
      }
      if (name.includes('gum') || name.includes('mouth ulcer')) {
        addClass('antiseptic', 50); addClass('vitamin b12', 40);
        ['chlorhexidine', 'benzydamine'].forEach(n => addName(n, 35));
      }
      if (name.includes('dry mouth') || name.includes('bad breath')) {
        addClass('saliva substitute', 40); addClass('antiseptic mouthwash', 40);
      }

      // WOMEN'S HEALTH (GYNECOLOGICAL - TOP PRIORITY)
      if (name.includes('menstrual') || name.includes('period') || name.includes('cramp')) {
        // Gynecologist's first-line drugs for menstrual cramps
        addClass('nsaid', 70); addClass('analgesic', 60); addClass('antispasmodic', 55);
        // TOP PRIORITY: Specific gynecological drugs
        ['mefenamic acid', 'tranexamic acid', 'norethisterone'].forEach(n => addName(n, 70)); // Gynecologist favorites
        ['naproxen', 'ibuprofen', 'drotaverine', 'hyoscine'].forEach(n => addName(n, 50));
        ['paracetamol', 'dicyclomine'].forEach(n => addName(n, 35));
      }
      if (name.includes('heavy') && name.includes('bleeding')) {
        // Gynecologist's drugs for heavy menstrual bleeding (menorrhagia)
        addClass('tranexamic acid', 80); addClass('progestin', 70); addClass('iron supplement', 50);
        // TOP PRIORITY: Specific gynecological drugs
        ['tranexamic acid', 'norethisterone', 'medroxyprogesterone'].forEach(n => addName(n, 75)); // Stop heavy bleeding
        ['ethamsylate', 'ferrous sulfate', 'ferrous fumarate'].forEach(n => addName(n, 45));
        ['folic acid', 'vitamin c'].forEach(n => addName(n, 30)); // For anemia support
      }
      if (name.includes('irregular period') || name.includes('pcos')) {
        // Gynecologist's drugs for irregular periods / PCOS
        addClass('oral contraceptive', 80); addClass('progestin', 70); addClass('hormone', 60);
        // TOP PRIORITY: Specific gynecological hormonal drugs
        ['norethisterone', 'medroxyprogesterone', 'dydrogesterone'].forEach(n => addName(n, 75)); // Cycle regulation
        ['diane-35', 'yasmin', 'meprate'].forEach(n => addName(n, 65)); // PCOS management
        ['metformin', 'myo-inositol'].forEach(n => addName(n, 45)); // PCOS support
      }
      if (name.includes('white discharge') || name.includes('vaginal')) {
        // Gynecologist's drugs for vaginal discharge / infections
        addClass('antifungal', 75); addClass('antibiotic', 65); addClass('antiseptic', 50);
        // TOP PRIORITY: Specific gynecological drugs
        ['fluconazole', 'clotrimazole', 'itraconazole'].forEach(n => addName(n, 70)); // Antifungal first
        ['metronidazole', 'secnidazole', 'tinidazole'].forEach(n => addName(n, 60)); // Bacterial vaginosis
        ['clindamycin', 'povidone iodine'].forEach(n => addName(n, 45)); // Topical/oral antibiotics
      }
      if (name.includes('hot flash') || name.includes('menopause')) {
        // Gynecologist's drugs for menopausal symptoms
        addClass('hormone replacement', 75); addClass('ssri', 50); addClass('snri', 45);
        // TOP PRIORITY: Specific gynecological HRT drugs
        ['conjugated estrogen', 'estradiol', 'tibolone'].forEach(n => addName(n, 70)); // HRT first-line
        ['paroxetine', 'venlafaxine', 'desvenlafaxine'].forEach(n => addName(n, 50)); // Non-hormonal option
        ['clonidine', 'gabapentin'].forEach(n => addName(n, 35)); // Alternative
      }
      if (name.includes('breast') || name.includes('mastalgia')) {
        // Gynecologist's drugs for breast tenderness / pain
        addClass('vitamin e', 65); addClass('evening primrose oil', 60); addClass('nsaid', 50);
        // TOP PRIORITY: Specific gynecological drugs for breast pain
        ['vitamin e', 'evening primrose oil', 'danazol'].forEach(n => addName(n, 65)); // First-line for mastalgia
        ['bromocriptine', 'tamoxifen'].forEach(n => addName(n, 55)); // Severe cases
        ['ibuprofen', 'naproxen'].forEach(n => addName(n, 40)); // Pain relief
      }

      // MENTAL HEALTH & SLEEP
      if (name.includes('depression') || name.includes('low mood')) {
        addClass('antidepressant', 60); addClass('ssri', 60); addClass('snri', 40);
        ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine'].forEach(n => addName(n, 40));
        addNegClass('benzodiazepine', 30);
      }
      if (name.includes('panic') || name.includes('severe anxiety')) {
        addClass('benzodiazepine', 60); addClass('ssri', 40);
        ['alprazolam', 'clonazepam', 'lorazepam'].forEach(n => addName(n, 40));
      }
      if (name.includes('mood swing') || name.includes('bipolar')) {
        addClass('mood stabilizer', 60); addClass('antipsychotic', 40);
        ['lithium', 'valproate', 'quetiapine'].forEach(n => addName(n, 35));
      }
      if (name.includes('memory') || name.includes('concentration') || name.includes('brain fog')) {
        addClass('nootropic', 50); addClass('multivitamin', 40);
        ['piracetam', 'ginkgo', 'vitamin b12'].forEach(n => addName(n, 30));
      }
      if (name.includes('stress') || name.includes('tension headache')) {
        addClass('anxiolytic', 50); addClass('magnesium', 40); addClass('adaptogen', 30);
        ['magnesium', 'ashwagandha'].forEach(n => addName(n, 30));
      }
      if (name.includes('excessive sleep') || name.includes('drowsiness')) {
        addClass('stimulant', 50); addClass('modafinil', 40);
        addNegClass('sedative', 60);
      }
      if (name.includes('nightmare') || name.includes('disturbed sleep')) {
        addClass('sedative', 40); addClass('anxiolytic', 40);
        ['zolpidem', 'eszopiclone'].forEach(n => addName(n, 30));
      }

      // ALLERGY & IMMUNE
      if (name.includes('sneez') || name.includes('rhinitis') || name.includes('hay fever')) {
        addClass('antihistamine', 60); addClass('nasal corticosteroid', 40);
        ['cetirizine', 'loratadine', 'fexofenadine', 'fluticasone'].forEach(n => addName(n, 40));
      }
      if (name.includes('hives') || name.includes('urticaria')) {
        addClass('antihistamine', 60); addClass('corticosteroid', 40);
        ['cetirizine', 'loratadine', 'prednisolone'].forEach(n => addName(n, 40));
      }
      if (name.includes('wheez') || name.includes('asthma')) {
        addClass('bronchodilator', 60); addClass('corticosteroid', 50);
        ['salbutamol', 'albuterol', 'budesonide', 'montelukast'].forEach(n => addName(n, 40));
      }
      if (name.includes('food allergy') || name.includes('anaphyla')) {
        addClass('antihistamine', 60); addClass('epinephrine', 50); addClass('corticosteroid', 40);
        ['epinephrine', 'prednisolone'].forEach(n => addName(n, 50));
      }
      if (name.includes('seasonal allergy') || name.includes('pollen')) {
        addClass('antihistamine', 60); addClass('nasal spray', 40);
        ['cetirizine', 'loratadine', 'mometasone'].forEach(n => addName(n, 35));
      }

      // CHRONIC CONDITIONS
      if (name.includes('diabetes') || name.includes('high blood sugar') || name.includes('hyperglyce')) {
        addClass('antidiabetic', 60); addClass('insulin', 50);
        ['metformin', 'glimepiride', 'insulin', 'sitagliptin'].forEach(n => addName(n, 40));
      }
      if (name.includes('low blood sugar') || name.includes('hypoglyce')) {
        addClass('glucose', 60);
        ['glucose', 'glucagon'].forEach(n => addName(n, 50));
      }
      if (name.includes('high blood pressure') || name.includes('hypertension')) {
        addClass('antihypertensive', 60); addClass('ace inhibitor', 50); addClass('beta blocker', 40);
        ['amlodipine', 'enalapril', 'losartan', 'metoprolol'].forEach(n => addName(n, 40));
      }
      if (name.includes('low blood pressure') || name.includes('hypotension')) {
        addClass('vasopressor', 50);
        addNegClass('antihypertensive', 60);
      }
      if (name.includes('thyroid') || name.includes('goiter')) {
        addClass('thyroid hormone', 60); addClass('antithyroid', 40);
        ['levothyroxine', 'carbimazole'].forEach(n => addName(n, 40));
      }
      if (name.includes('anemia') || name.includes('pallor') || name.includes('pale')) {
        addClass('iron supplement', 60); addClass('vitamin b12', 50); addClass('folic acid', 40);
        ['ferrous', 'folic', 'vitamin b12'].forEach(n => addName(n, 40));
      }

      // NEUROLOGICAL
      if (name.includes('tremor') || name.includes('shak') || name.includes('parkinson')) {
        addClass('antiparkinson', 60); addClass('beta blocker', 40);
        ['levodopa', 'carbidopa', 'propranolol'].forEach(n => addName(n, 40));
      }
      if (name.includes('numbness') || name.includes('tingling') || name.includes('neuropathy')) {
        addClass('vitamin b12', 60); addClass('neuropathic pain agent', 50);
        ['vitamin b12', 'gabapentin', 'pregabalin'].forEach(n => addName(n, 40));
      }
      if (name.includes('confusion') || name.includes('alzheimer') || name.includes('dementia')) {
        addClass('dementia medication', 60); addClass('nootropic', 40);
        ['donepezil', 'rivastigmine', 'memantine'].forEach(n => addName(n, 40));
      }
      if (name.includes('seizure') || name.includes('epilepsy') || name.includes('fit')) {
        addClass('anticonvulsant', 60); addClass('antiepileptic', 60);
        ['phenytoin', 'carbamazepine', 'valproate', 'levetiracetam'].forEach(n => addName(n, 40));
      }
      if (name.includes('vertigo') || name.includes('balance')) {
        addClass('antivertigo', 60); addClass('antihistamine', 40);
        ['betahistine', 'meclizine'].forEach(n => addName(n, 40));
      }
      if (name.includes('speech') || name.includes('stroke')) {
        addClass('stroke medication', 60); addClass('neuroprotective', 40);
        ['aspirin', 'clopidogrel'].forEach(n => addName(n, 40));
      }

      // OTHER
      if (name.includes('burn') && name.includes('urinat')) {
        addClass('antibiotic', 60); addClass('urinary alkalizer', 40);
        ['nitrofurantoin', 'ciprofloxacin', 'trimethoprim'].forEach(n => addName(n, 40));
      }
    });

    return { classWeights, nameWeights, negativeClassWeights, negativeNameWeights };
  };

  // Load all drugs on component mount
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const drugs = await loadAllDrugs();
        setAllDrugs(drugs);
      } catch (error) {
        console.error('Error loading drugs:', error);
        toast.error('Failed to load medication database');
      }
    };
    loadDrugs();
  }, []);

  // Search and match drugs when symptoms are selected
  useEffect(() => {
    if (selectedSymptoms.length === 0) {
      setMatchedDrugs([]);
      return;
    }

    setIsLoading(true);

    // Combine all related drug classes and categories from selected symptoms
    const relatedClasses = new Set<string>();
    const relatedCategories = new Set<string>();

    selectedSymptoms.forEach(symptom => {
      symptom.relatedDrugClasses.forEach(dc => relatedClasses.add(dc.toLowerCase()));
      symptom.relatedCategories.forEach(cat => relatedCategories.add(cat.toLowerCase()));
    });

    // Advanced ranking with whole-word matching, indication weighting, and symptom-specific boosts
    const { classWeights, nameWeights, negativeClassWeights, negativeNameWeights } = getSymptomPriorityWeights(selectedSymptoms);
    const scored = allDrugs.map(drug => {
      const cls = (drug.drugClass || '').toLowerCase();
      const cat = (drug.category || '').toLowerCase();
      const indications = (drug.indications || []).map(i => i.toLowerCase());
      const name = drug.name.toLowerCase();
      const generic = (drug.genericName || '').toLowerCase();
      const brands = (drug.brandNames || []).map(b => b.toLowerCase());

      // Match class by exact token OR substring presence (handles variations like "nonsteroidal anti-inflammatory")
      const relatedClassHit = Array.from(relatedClasses).some(token => cls.includes(token));
      const classBoost = Object.keys(classWeights).reduce((acc, token) => acc + (cls.includes(token) ? classWeights[token] : 0), 0);
      const classHit = relatedClassHit || classBoost > 0;
      const categoryHit = cat && relatedCategories.has(cat);

      // Advanced keyword matching with whole-word boundaries and weighting
      let primaryIndicationScore = 0;   // Exact/strong matches
      let secondaryIndicationScore = 0; // Partial matches
      let keywordMatchCount = 0;

      selectedSymptoms.forEach(sym => {
        sym.keywords.forEach(kw => {
          const k = kw.toLowerCase().trim();
          if (k.length < 3) return; // Skip very short keywords

          indications.forEach(indication => {
            try {
              // Primary match: whole-word boundary match (more precise)
              const wordBoundaryRegex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              if (wordBoundaryRegex.test(indication)) {
                primaryIndicationScore += 5; // High weight for exact matches
                keywordMatchCount += 1;
                // Extra weight if keyword appears in first 50 chars (primary indication)
                const pos = indication.indexOf(k);
                if (pos >= 0 && pos < 50) {
                  primaryIndicationScore += 2;
                }
              } else if (indication.includes(k)) {
                // Secondary match: partial/substring match (less precise)
                secondaryIndicationScore += 1;
              }
            } catch {
              // Fallback to simple includes if regex fails
              if (indication.includes(k)) {
                secondaryIndicationScore += 1;
              }
            }
          });

          // Check if symptom keyword appears in drug name or generic (often indicates specialization)
          if (name.includes(k) || generic.includes(k)) {
            primaryIndicationScore += 3;
          }
        });
      });

      // Name-based boosts for known first-line generics per symptom
      const nameBoost = Object.keys(nameWeights).reduce((acc, token) => {
        const hit = name.includes(token) || generic.includes(token) || brands.some(b => b.includes(token));
        return acc + (hit ? nameWeights[token] : 0);
      }, 0);

      // Calculate comprehensive score with multiple factors
      const negClassPenalty = Object.keys(negativeClassWeights).reduce((acc, token) => acc + (cls.includes(token) ? negativeClassWeights[token] : 0), 0);
      const negNamePenalty = Object.keys(negativeNameWeights).reduce((acc, token) => {
        const hit = name.includes(token) || generic.includes(token) || brands.some(b => b.includes(token));
        return acc + (hit ? negativeNameWeights[token] : 0);
      }, 0);
      const score =
        (primaryIndicationScore * 3)           // Strong indication matches (highest weight)
        + (secondaryIndicationScore * 0.5)     // Partial matches (lower weight)
        + (classHit ? 8 : 0)                   // Drug class match (high weight)
        + classBoost                            // Symptom-specific class boosts
        + nameBoost                             // Symptom-specific name boosts
        + (categoryHit ? 4 : 0)                // Category match (medium weight)
        + (drug.verified ? 3 : 0)              // Verified drugs preferred
        + (keywordMatchCount * 2)              // Reward multiple keyword matches
        + ((drug.brandNames && drug.brandNames.length > 2) ? 2 : 0) // Well-known drugs
        + (drug.indications && drug.indications.length > 3 ? 1 : 0)  // Versatile drugs
        + negClassPenalty + negNamePenalty;     // Deprioritize non-first-line options

      return {
        drug,
        score,
        primaryIndicationScore,
        secondaryIndicationScore,
        keywordMatchCount,
        classHit,
        classBoost,
        categoryHit
      };
    })
      .filter(x =>
        x.classHit ||
        x.categoryHit ||
        x.primaryIndicationScore > 0 ||
        x.keywordMatchCount > 0
      )
      .sort((a, b) => {
        // Primary sort by score
        if (b.score !== a.score) return b.score - a.score;
        // Tiebreaker: prefer drugs with more primary matches
        if (b.primaryIndicationScore !== a.primaryIndicationScore) {
          return b.primaryIndicationScore - a.primaryIndicationScore;
        }
        // Next tiebreaker: higher classBoost
        if (b.classBoost !== a.classBoost) return b.classBoost - a.classBoost;
        // Final tiebreaker: verified status
        return (b.drug.verified ? 1 : 0) - (a.drug.verified ? 1 : 0);
      });

    // Show top highly relevant medications (reduced from 50 to avoid confusion)
    setMatchedDrugs(scored.slice(0, 12).map(x => x.drug));
    setIsLoading(false);
  }, [selectedSymptoms, allDrugs]);

  const handleSymptomClick = (symptom: Symptom) => {
    if (selectedSymptoms.find(s => s.id === symptom.id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== symptom.id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleViewSymptomDrugs = (symptom: Symptom) => {
    setViewingSymptom(symptom);

    // Get drugs specific to this symptom with advanced matching
    const relatedClasses = new Set<string>();
    const relatedCategories = new Set<string>();

    symptom.relatedDrugClasses.forEach(dc => relatedClasses.add(dc.toLowerCase()));
    symptom.relatedCategories.forEach(cat => relatedCategories.add(cat.toLowerCase()));

    // Apply same advanced scoring as main symptom checker with symptom-specific weights
    const { classWeights, nameWeights, negativeClassWeights, negativeNameWeights } = getSymptomPriorityWeights([symptom]);
    const scored = allDrugs.map(drug => {
      const cls = (drug.drugClass || '').toLowerCase();
      const cat = (drug.category || '').toLowerCase();
      const indications = (drug.indications || []).map(i => i.toLowerCase());
      const name = drug.name.toLowerCase();
      const generic = (drug.genericName || '').toLowerCase();
      const brands = (drug.brandNames || []).map(b => b.toLowerCase());

      // Match class by exact token OR substring presence
      const relatedClassHit = Array.from(relatedClasses).some(token => cls.includes(token));
      const classBoost = Object.keys(classWeights).reduce((acc, token) => acc + (cls.includes(token) ? classWeights[token] : 0), 0);
      const classHit = relatedClassHit || classBoost > 0;
      const categoryHit = cat && relatedCategories.has(cat);

      let primaryIndicationScore = 0;
      let secondaryIndicationScore = 0;
      let keywordMatchCount = 0;

      symptom.keywords.forEach(kw => {
        const k = kw.toLowerCase().trim();
        if (k.length < 3) return;

        indications.forEach(indication => {
          try {
            const wordBoundaryRegex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (wordBoundaryRegex.test(indication)) {
              primaryIndicationScore += 5;
              keywordMatchCount += 1;
              const pos = indication.indexOf(k);
              if (pos >= 0 && pos < 50) {
                primaryIndicationScore += 2;
              }
            } else if (indication.includes(k)) {
              secondaryIndicationScore += 1;
            }
          } catch {
            if (indication.includes(k)) {
              secondaryIndicationScore += 1;
            }
          }
        });

        if (name.includes(k) || generic.includes(k)) {
          primaryIndicationScore += 3;
        }
      });

      // Name-based boost for known first-line generics
      const nameBoost = Object.keys(nameWeights).reduce((acc, token) => {
        const hit = name.includes(token) || generic.includes(token) || brands.some(b => b.includes(token));
        return acc + (hit ? nameWeights[token] : 0);
      }, 0);

      // Negative penalties inline
      const negClassPenalty = Object.keys(negativeClassWeights).reduce((acc, token) => acc + (cls.includes(token) ? negativeClassWeights[token] : 0), 0);
      const negNamePenalty = Object.keys(negativeNameWeights).reduce((acc, token) => {
        const hit = name.includes(token) || generic.includes(token) || brands.some(b => b.includes(token));
        return acc + (hit ? negativeNameWeights[token] : 0);
      }, 0);

      const score =
        (primaryIndicationScore * 3)
        + (secondaryIndicationScore * 0.5)
        + (classHit ? 8 : 0)
        + classBoost
        + nameBoost
        + (categoryHit ? 4 : 0)
        + (drug.verified ? 3 : 0)
        + (keywordMatchCount * 2)
        + ((drug.brandNames && drug.brandNames.length > 2) ? 2 : 0)
        + negClassPenalty + negNamePenalty;

      return { drug, score, primaryIndicationScore, classHit, classBoost, categoryHit };
    })
      .filter(x => x.classHit || x.categoryHit || x.primaryIndicationScore > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.primaryIndicationScore !== a.primaryIndicationScore) {
          return b.primaryIndicationScore - a.primaryIndicationScore;
        }
        if (b.classBoost !== a.classBoost) return b.classBoost - a.classBoost;
        return (b.drug.verified ? 1 : 0) - (a.drug.verified ? 1 : 0);
      });

    setSymptomDrugs(scored.slice(0, 15).map(x => x.drug)); // Limit to 15 most relevant
  };

  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSymptomVoiceSearch = () => {
    if (!recognitionRef.current) return;

    try {
      const recognition = recognitionRef.current;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        const cleaned = transcript.trim();
        if (!cleaned) return;

        const lower = cleaned.toLowerCase();
        let bestMatch = cleaned;
        let bestScore = Number.MAX_SAFE_INTEGER;

        symptoms.forEach(symptom => {
          const candidates = [symptom.nameEn, symptom.nameHi].filter(Boolean) as string[];
          candidates.forEach(name => {
            const n = name.toLowerCase();
            const distance = calculateLevenshteinDistance(lower, n);
            if (distance < bestScore) {
              bestScore = distance;
              bestMatch = symptom.nameEn;
            }
          });
        });

        const threshold = Math.min(4, Math.max(1, Math.floor(lower.length / 3)));
        const finalTerm = bestScore <= threshold ? bestMatch : cleaned;
        setSearchTerm(finalTerm);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onsoundstart = () => {
        setIsListening(true);
      };
      recognition.onsoundend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      setIsListening(false);
    }
  };

  // Filter symptoms based on search
  const filteredCategories = symptomCategories.map(category => ({
    ...category,
    symptoms: category.symptoms.filter(symptom =>
      symptom.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symptom.nameHi.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.symptoms.length > 0);

  const symptomCheckerStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        "@id": "https://pharmalens-drug-identify.vercel.app/symptom-checker#webpage",
        "name": "AI Symptom Checker - Find Medications by Symptom | PharmaLens",
        "description": "AI-powered symptom checker that maps 100+ symptoms across 15 categories to relevant medications from a database of 1,500+ drugs. Select symptoms to instantly see matched medicines with dosage, side effects, and safety information.",
        "url": "https://pharmalens-drug-identify.vercel.app/symptom-checker",
        "datePublished": "2025-01-01",
        "dateModified": "2026-02-26",
        "isAccessibleForFree": true,
        "inLanguage": "en-IN",
        "specialty": "Pharmacy",
        "medicalAudience": {
          "@type": "MedicalAudience",
          "audienceType": "Patient"
        },
        "publisher": {
          "@type": "Organization",
          "name": "PharmaLens",
          "url": "https://pharmalens-drug-identify.vercel.app"
        },
        "about": [
          { "@type": "MedicalCondition", "name": "Headache" },
          { "@type": "MedicalCondition", "name": "Fever" },
          { "@type": "MedicalCondition", "name": "Cough" },
          { "@type": "MedicalCondition", "name": "Nausea" },
          { "@type": "MedicalCondition", "name": "Stomach Pain" },
          { "@type": "MedicalCondition", "name": "Allergy" },
          { "@type": "MedicalCondition", "name": "Anxiety" },
          { "@type": "MedicalCondition", "name": "Joint Pain" },
          { "@type": "MedicalCondition", "name": "Diabetes" },
          { "@type": "MedicalCondition", "name": "Hypertension" },
          { "@type": "MedicalCondition", "name": "Asthma" },
          { "@type": "MedicalCondition", "name": "Insomnia" },
          { "@type": "MedicalCondition", "name": "Menstrual Cramps" },
          { "@type": "MedicalCondition", "name": "Acne" },
          { "@type": "MedicalCondition", "name": "Diarrhea" }
        ],
        "potentialAction": {
          "@type": "UseAction",
          "name": "Check symptoms and find medications",
          "target": "https://pharmalens-drug-identify.vercel.app/symptom-checker"
        },
        "mainContentOfPage": {
          "@type": "WebPageElement",
          "cssSelector": ".container"
        },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", "p.text-gray-600"]
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "PharmaLens Symptom Checker",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web Browser",
        "url": "https://pharmalens-drug-identify.vercel.app/symptom-checker",
        "description": "Select from 100+ symptoms across categories like digestive, respiratory, neurological, and women's health to find matching medications from PharmaLens's database of 1,500+ drugs.",
        "featureList": [
          "100+ symptoms across 15 medical categories",
          "AI-powered drug matching algorithm",
          "Voice-based symptom search",
          "1,500+ medications in database",
          "Women's health, neurological, and chronic condition symptoms",
          "Instant medication recommendations with safety information"
        ],
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        },
        "provider": {
          "@type": "Organization",
          "name": "PharmaLens",
          "url": "https://pharmalens-drug-identify.vercel.app"
        }
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="AI Symptom Checker - Find Medicines by Symptom | PharmaLens"
        description="Instantly find medicines for your symptoms. Select from 100+ symptoms across headache, fever, cough, allergy, diabetes, women's health and more. Matches from a database of 1,500+ drugs with dosage, side effects, and safety info."
        keywords="AI symptom checker, symptom to medicine, medication finder by symptom, check symptoms online, drug symptom search, medicine finder India, health symptom analysis, what medicine for headache, fever medicine finder, cold medicine checker, stomach pain remedy finder, OTC medicine by symptom, find drug by symptoms, symptom based drug search"
        canonicalUrl="/symptom-checker"
        structuredData={symptomCheckerStructuredData}
      />
      <Header />
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Symptom-Based Drug Search</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                Find medications based on your symptoms
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto flex items-center gap-2 justify-center"
                onClick={() => navigate('/identify')}
              >
                <Stethoscope className="h-4 w-4" />
                <span>Identify Medication</span>
              </Button>
              {allDrugs.length > 0 && (
                <div className="flex items-center gap-2 bg-pharma-50 dark:bg-pharma-900/20 px-3 py-2 rounded-lg">
                  <Pill className="h-4 w-4 text-pharma-600" />
                  <span className="text-sm font-medium text-pharma-700 dark:text-pharma-300">
                    {allDrugs.length.toLocaleString()} medications available
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Warning Alert */}
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Medical Disclaimer</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
            This tool is for informational purposes only and does not replace professional medical advice.
            Always consult a qualified healthcare provider for diagnosis and treatment.
          </AlertDescription>
        </Alert>

        {/* Individual Symptom View Modal */}
        {viewingSymptom && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      Medications for: {viewingSymptom.nameEn}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {viewingSymptom.nameHi} • {symptomDrugs.length} medications found
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewingSymptom(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-y-auto p-6">
                  {symptomDrugs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {symptomDrugs.map((drug) => (
                        <div
                          key={drug.id}
                          onClick={() => {
                            setViewingSymptom(null);
                            navigate(`/drug/${drug.id}`);
                          }}
                          className="cursor-pointer"
                        >
                          <DrugCard drug={drug} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No specific medications found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try selecting multiple symptoms for better results.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
          {/* Left Panel - Symptoms Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Symptoms</CardTitle>
                <CardDescription>Choose one or more symptoms you're experiencing</CardDescription>

                {/* Search Bar */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search symptoms..."
                    className="pl-10 pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={handleSymptomVoiceSearch}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 ${isListening ? 'text-pharma-600 mic-listening' : ''}`}
                      aria-label="Voice search symptoms"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredCategories.map((category) => (
                  <div key={category.title} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.title)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-2 py-1 font-mono bg-pharma-50 text-pharma-700 border-pharma-300 dark:bg-pharma-900/20 dark:text-pharma-300 dark:border-pharma-700">
                          {category.icon}
                        </Badge>
                        <span className="font-semibold">{category.title}</span>
                        <Badge variant="secondary">{category.symptoms.length}</Badge>
                      </div>
                      {expandedCategories.has(category.title) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedCategories.has(category.title) && (
                      <div className="p-4 space-y-2">
                        {category.symptoms.map((symptom) => {
                          const isSelected = selectedSymptoms.some(s => s.id === symptom.id);
                          return (
                            <div
                              key={symptom.id}
                              className={`p-3 rounded-lg border transition-all ${isSelected
                                ? 'bg-pharma-500 text-white shadow-md border-pharma-500'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-pharma-300'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{symptom.nameEn}</div>
                                  <div className="text-xs opacity-80">{symptom.nameHi}</div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <Button
                                    size="sm"
                                    variant={isSelected ? "secondary" : "outline"}
                                    onClick={() => handleViewSymptomDrugs(symptom)}
                                    className="h-8 px-2"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={isSelected ? "secondary" : "default"}
                                    onClick={() => handleSymptomClick(symptom)}
                                    className="h-8 px-3"
                                  >
                                    {isSelected ? '✓' : '+'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selected Symptoms & Quick Link */}
          <div className="space-y-4">
            {/* Selected Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSymptoms.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No symptoms selected yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <Badge
                        key={symptom.id}
                        variant="default"
                        className="cursor-pointer hover:bg-red-500"
                        onClick={() => handleSymptomClick(symptom)}
                      >
                        {symptom.nameEn} ✕
                      </Badge>
                    ))}
                  </div>
                )}

                {selectedSymptoms.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setSelectedSymptoms([])}
                  >
                    Clear All
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Drug Interaction Checker Link */}
            <Card className="bg-gradient-to-br from-pharma-50 to-blue-50 dark:from-pharma-900/20 dark:to-blue-900/20 border-pharma-200 dark:border-pharma-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Drug Interaction Checker
                </CardTitle>
                <CardDescription>
                  Check if your medications interact with each other
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => navigate('/drug-interactions')}
                >
                  Check Interactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Matched Drugs Section */}
        {selectedSymptoms.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Recommended Medications
                {matchedDrugs.length > 0 && (
                  <span className="text-sm sm:text-lg font-normal text-gray-600 dark:text-gray-400 ml-2">
                    ({matchedDrugs.length} found)
                  </span>
                )}
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="p-6 border rounded-xl">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                ))}
              </div>
            ) : matchedDrugs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    onClick={() => navigate(`/drug/${drug.id}`)}
                    className="cursor-pointer"
                  >
                    <DrugCard drug={drug} />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No medications found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try selecting different symptoms or consult a healthcare professional for personalized advice.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {selectedSymptoms.length === 0 && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pharma-100 dark:bg-pharma-900/30 mb-4">
                <Search className="h-8 w-8 text-pharma-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Select symptoms to get started</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Choose one or more symptoms from the categories above to find medications that can help treat your condition.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default SymptomChecker;
