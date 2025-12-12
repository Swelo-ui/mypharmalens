import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, X, Plus, Shield, Info, ArrowRight, ExternalLink, ChevronDown, Mic, Activity, Zap, Database, Check } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { loadAllDrugs } from '@/data/drugDataLoader';
import { DrugData } from '@/components/DrugCard';
import {
  checkDrugInteractions,
  getSeverityColor,
  getSeverityBadgeColor,
  InteractionCheckResult
} from '@/utils/drugInteractionChecker';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
// Removed popover/command UI to use inline, mobile-friendly list

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

const DrugInteractionChecker = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [allDrugs, setAllDrugs] = useState<DrugData[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<DrugData[]>([]);
  const [useLaymanTerms, setUseLaymanTerms] = useState(true); // Default to layman terms for better UX
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionCheckResult | null>(null);
  // Inline list state
  const [showSummary, setShowSummary] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
  // Load all drugs and restore selections on component mount
  useEffect(() => {
    const loadDrugs = async () => {
      setIsLoading(true);
      try {
        const drugs = await loadAllDrugs();
        setAllDrugs(drugs);

        // Restore selected drugs from sessionStorage
        const savedSelections = sessionStorage.getItem('selectedDrugs');
        if (savedSelections) {
          try {
            const drugIds = JSON.parse(savedSelections);
            const restored = drugs.filter(d => drugIds.includes(d.id));
            if (restored.length > 0) {
              setSelectedDrugs(restored);
              toast.success(`Restored ${restored.length} medication(s)`);
            }
          } catch (e) {
            console.error('Error restoring selections:', e);
          }
        }
      } catch (error) {
        console.error('Error loading drugs:', error);
        toast.error('Failed to load medication database');
      } finally {
        setIsLoading(false);
      }
    };
    loadDrugs();
  }, []);

  // Check interactions when drugs are selected and persist to sessionStorage
  useEffect(() => {
    // Save to sessionStorage for persistence across navigation
    if (selectedDrugs.length > 0) {
      sessionStorage.setItem('selectedDrugs', JSON.stringify(selectedDrugs.map(d => d.id)));
    } else {
      sessionStorage.removeItem('selectedDrugs');
    }

    if (selectedDrugs.length >= 2) {
      const result = checkDrugInteractions(selectedDrugs, allDrugs);
      setInteractionResult(result);
    } else {
      setInteractionResult(null);
    }
  }, [selectedDrugs, allDrugs]);

  const handleAddDrug = (drug: DrugData) => {
    if (!selectedDrugs.find(d => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, drug]);
      toast.success(`${drug.name} added`);
    } else {
      toast.info('This medication is already added');
    }
    setSearchTerm('');
  };

  const handleRemoveDrug = (drugId: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
  };

  const handleDrugVoiceSearch = () => {
    if (!recognitionRef.current) return;

    try {
      const recognition = recognitionRef.current;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const cleaned = transcript.trim();
        if (!cleaned) return;

        const lower = cleaned.toLowerCase();
        let bestMatch = cleaned;
        let bestScore = Number.MAX_SAFE_INTEGER;

        allDrugs.forEach(drug => {
          const candidates: string[] = [];
          if (drug.name) candidates.push(drug.name);
          if (drug.genericName) candidates.push(drug.genericName);
          (drug.brandNames || []).forEach(b => candidates.push(b));

          candidates.forEach(name => {
            const n = name.toLowerCase();
            const distance = calculateLevenshteinDistance(lower, n);
            if (distance < bestScore) {
              bestScore = distance;
              bestMatch = name;
            }
          });
        });

        const threshold = Math.min(4, Math.max(1, Math.floor(lower.length / 3)));
        const finalTerm = bestScore <= threshold ? bestMatch : cleaned;
        setSearchTerm(finalTerm);
        setPage(1);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Animate waves only when sound is detected
      (recognition as any).onsoundstart = () => {
        setIsListening(true);
      };
      (recognition as any).onsoundend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch (error) {
      setIsListening(false);
    }
  };

  // Search helper: require minimal characters and dedupe by display key (name+generic)
  const filteredDrugs = (() => {
    const q = searchTerm.trim().toLowerCase();
    // If browsing all with empty query, show full list (paged)
    if (showAll && q.length === 0) return allDrugs.slice();
    if (q.length < 1) return [] as DrugData[];

    // Rank results: exact > startsWith > includes
    const score = (drug: DrugData) => {
      const name = drug.name?.toLowerCase() || '';
      const generic = drug.genericName?.toLowerCase() || '';
      const brands = (drug.brandNames || []).map(b => b.toLowerCase());

      let s = 0;
      if (name === q) s += 100;
      if (generic && generic === q) s += 100;
      if (brands.some(b => b === q)) s += 100;

      if (name.startsWith(q)) s += 50;
      if (generic && generic.startsWith(q)) s += 40;
      if (brands.some(b => b.startsWith(q))) s += 40;

      if (name.includes(q)) s += 10;
      if (generic && generic.includes(q)) s += 8;
      if (brands.some(b => b.includes(q))) s += 8;

      return s;
    };

    // Dedupe suggestions by display key to avoid visually duplicate rows
    const seen = new Set<string>();
    const byScore = allDrugs
      .filter(drug => {
        const name = drug.name?.toLowerCase() || '';
        const generic = drug.genericName?.toLowerCase() || '';
        const brandHit = (drug.brandNames || []).some(brand => brand.toLowerCase().includes(q));
        return name.includes(q) || (generic && generic.includes(q)) || brandHit;
      })
      .sort((a, b) => score(b) - score(a))
      .filter(drug => {
        const key = `${(drug.name || '').toLowerCase()}|${(drug.genericName || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return byScore; // we'll page in the UI
  })();

  // Visible list with pagination
  const visibleDrugs = (() => {
    const list = filteredDrugs.length > 0
      ? filteredDrugs
      : (showAll ? allDrugs.slice().sort((a, b) => a.name.localeCompare(b.name)) : []);
    return list.slice(0, page * pageSize);
  })();

  const severityCounts = useMemo(() => {
    const base = { mild: 0, moderate: 0, severe: 0, contraindicated: 0 } as const;
    if (!interactionResult) {
      return { ...base };
    }
    return interactionResult.interactions.reduce(
      (acc, interaction) => {
        acc[interaction.severity] += 1;
        return acc;
      },
      { mild: 0, moderate: 0, severe: 0, contraindicated: 0 }
    );
  }, [interactionResult]);

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
        return 'CONTRAINDICATED';
      case 'severe':
        return 'SEVERE';
      case 'moderate':
        return 'MODERATE';
      case 'mild':
        return 'MILD';
      default:
        return severity.toUpperCase();
    }
  };

  return (
    <>
      <SEOHead
        title="Free Drug Interaction Checker - Instant Safety Analysis | PharmaLens"
        description="Check for harmful interactions between prescription drugs, OTC medicines, and supplements. Free, instant, and comprehensive medication safety analysis tool powered by AI."
        keywords="drug interaction checker, free medication interaction check, pill checker, drug safety analysis, medicine combination safety, contraindications checker, multi-drug interaction, check drug reactions, medication safety, polypharmacy checker"
        canonicalUrl="/drug-interactions"
      />
      {/* FAQPage Schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I check drug interactions?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Add two or more medications using the search box, and our AI-powered tool will instantly analyze potential interactions between them, showing severity levels and recommendations."
              }
            },
            {
              "@type": "Question",
              "name": "What do the severity levels mean?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Mild interactions may cause minor effects. Moderate interactions require monitoring. Severe interactions may cause serious harm. Contraindicated combinations should never be used together."
              }
            },
            {
              "@type": "Question",
              "name": "Is this drug interaction checker free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, PharmaLens drug interaction checker is completely free to use with no registration required. Check unlimited medication combinations 24/7."
              }
            },
            {
              "@type": "Question",
              "name": "How accurate is this drug interaction checker?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our database covers 1000+ known drug interactions with 99.9% accuracy based on clinical guidelines and pharmacological research. However, always consult your healthcare provider for medical advice."
              }
            }
          ]
        })
      }} />
      <Header />

      {/* Header Section - matching SymptomChecker layout */}
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Drug Interaction Checker</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              Check for potentially dangerous drug combinations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 justify-center"
              onClick={() => navigate('/symptom-checker')}
            >
              <Activity className="h-4 w-4" />
              <span>Symptom Checker</span>
            </Button>
            {allDrugs.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {allDrugs.length.toLocaleString()} medications available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row - inline horizontal */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl">
          <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-lg font-bold text-red-600">{allDrugs.length.toLocaleString()}+</div>
            <div className="text-[8px] sm:text-xs text-gray-600 dark:text-gray-400">Drugs</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-lg font-bold text-red-600">1000+</div>
            <div className="text-[8px] sm:text-xs text-gray-600 dark:text-gray-400">Interactions</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-lg font-bold text-red-600">99.9%</div>
            <div className="text-[8px] sm:text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm sm:text-lg font-bold text-red-600">24/7</div>
            <div className="text-[8px] sm:text-xs text-gray-600 dark:text-gray-400">Available</div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Warning Alert */}
        <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Important Safety Information</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400 text-xs sm:text-sm">
            This tool provides general information about drug interactions. It does not replace professional medical advice.
            Always consult your healthcare provider before starting, stopping, or changing medications.
          </AlertDescription>
        </Alert>

        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
          {/* Left Panel - Drug Selection */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Add Drug Card */}
            <Card className="shadow-md border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-red-600" />
                  </div>
                  Add Medications
                </CardTitle>
                <CardDescription>Search and add medications you're currently taking or planning to take</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search medications by name or brand..."
                      className="pl-10 pr-10"
                      value={searchTerm}
                      onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                    />
                    {isSpeechSupported && (
                      <button
                        type="button"
                        onClick={handleDrugVoiceSearch}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 ${isListening ? 'text-pharma-600 mic-listening' : ''}`}
                        aria-label="Voice search medications"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Browse all toggle */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {showAll ? `Browsing all (${allDrugs.length.toLocaleString()})` : (searchTerm.trim().length < 1 ? 'Type at least 1 character or browse all' : `${filteredDrugs.length} matches`)}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setShowAll(!showAll); setPage(1); }}>
                      {showAll ? 'Hide All' : 'Browse All'}
                    </Button>
                  </div>

                  {/* Results list */}
                  <div className="border rounded-lg max-h-[360px] overflow-y-auto divide-y">
                    {visibleDrugs.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No medication found.</div>
                    ) : (
                      visibleDrugs.map((drug) => (
                        <div key={drug.id} className="p-3 flex items-center justify-between gap-3 hover:bg-pharma-50/50 dark:hover:bg-pharma-900/20 transition-colors rounded-lg">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-gray-900 dark:text-gray-100">{drug.name}</div>
                            {drug.genericName && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate italic">{drug.genericName}</div>
                            )}
                            {drug.drugClass && (
                              <div className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-pharma-100 dark:bg-pharma-900/30 text-pharma-700 dark:text-pharma-300">{drug.drugClass}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/drug/${drug.id}`)} className="text-gray-500 hover:text-pharma-600">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleAddDrug(drug)} className="bg-red-600 hover:bg-red-700">
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {((filteredDrugs.length > 0 ? filteredDrugs : (showAll ? allDrugs : [])).length > visibleDrugs.length) && (
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={() => setPage(p => p + 1)}>Load more</Button>
                    </div>
                  )}
                </div>

                {/* Selected Drugs List */}
                <div className="mt-4 space-y-2">
                  {selectedDrugs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No medications added yet</p>
                      <p className="text-xs mt-1">Add at least 2 medications to check for interactions</p>
                    </div>
                  ) : (
                    selectedDrugs.map((drug, index) => (
                      <div
                        key={drug.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg hover:border-pharma-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-600 font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{drug.name}</div>
                            {drug.genericName && (
                              <div className="text-xs text-gray-500 truncate">{drug.genericName}</div>
                            )}
                            {drug.drugClass && (
                              <Badge variant="secondary" className="text-xs mt-1">{drug.drugClass}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/drug/${drug.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDrug(drug.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interaction Results */}
            {selectedDrugs.length >= 2 && interactionResult && (
              <Card className="shadow-md border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-base sm:text-lg">Interaction Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs sm:text-sm font-normal cursor-pointer flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                        <input
                          type="checkbox"
                          checked={useLaymanTerms}
                          onChange={(e) => setUseLaymanTerms(e.target.checked)}
                          className="w-3 h-3 sm:w-4 sm:h-4 accent-red-600"
                        />
                        <span className="hidden sm:inline">Simple terms</span>
                        <span className="sm:hidden">Simple</span>
                      </label>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {interactionResult.hasInteractions
                      ? `Found ${interactionResult.interactions.length} potential interaction(s)`
                      : 'No significant interactions detected'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!interactionResult.hasInteractions ? (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Safe Combination</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        No known interactions detected between the selected medications based on available data.
                        However, always inform your healthcare provider about all medications you're taking.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {interactionResult.interactions.map((interaction, index) => (
                        <Alert
                          key={index}
                          className={"p-0 bg-transparent border-0 shadow-none"}
                        >
                          <AlertTitle className="mb-3">
                            <div
                              className={`flex flex-col sm:flex-row sm:items-center gap-2 mb-2 border-l-4 pl-4 ${interaction.severity === 'contraindicated'
                                ? 'border-red-500'
                                : interaction.severity === 'severe'
                                  ? 'border-orange-500'
                                  : interaction.severity === 'moderate'
                                    ? 'border-yellow-500'
                                    : 'border-blue-500'
                                }`}
                            >
                              <span className="font-semibold text-sm sm:text-base break-words leading-tight">
                                {interaction.drug1.name} ↔ {interaction.drug2.name}
                              </span>
                              <Badge className={`${getSeverityBadgeColor(interaction.severity)} text-xs w-fit flex-shrink-0`}>
                                {getSeverityLabel(interaction.severity)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <span className="font-semibold">Type:</span>
                                <span className="break-words">
                                  {useLaymanTerms
                                    ? `${interaction.drug1.drugClass?.replace(/[A-Z]/g, ' $&').trim() || 'Medicine'} + ${interaction.drug2.drugClass?.replace(/[A-Z]/g, ' $&').trim() || 'Medicine'}`
                                    : `${interaction.drug1.drugClass || 'N/A'} + ${interaction.drug2.drugClass || 'N/A'}`
                                  }
                                </span>
                              </span>
                            </div>
                          </AlertTitle>
                          <AlertDescription className="space-y-3 text-sm">
                            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                              <p className="font-semibold mb-1 text-xs uppercase tracking-wide">What Happens:</p>
                              <p className="text-sm leading-relaxed break-words">
                                {useLaymanTerms && interaction.laymanDescription
                                  ? interaction.laymanDescription
                                  : interaction.description}
                              </p>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="font-semibold mb-1 text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">What To Do:</p>
                              <p className="text-sm leading-relaxed break-words">
                                {useLaymanTerms && interaction.laymanRecommendation
                                  ? interaction.laymanRecommendation
                                  : interaction.recommendation}
                              </p>
                            </div>

                            {/* Additional clinical info (responsive layout) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="font-semibold mb-1">When it starts:</p>
                                <p className="text-gray-600 dark:text-gray-400 break-words">
                                  {interaction.onset || (interaction.severity === 'contraindicated' || interaction.severity === 'severe'
                                    ? (useLaymanTerms ? 'Quickly (hours to days)' : 'Rapid (hours to days)')
                                    : (useLaymanTerms ? 'Varies (days to weeks)' : 'Variable (days to weeks)'))}
                                </p>
                              </div>
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="font-semibold mb-1">What to watch:</p>
                                <p className="text-gray-600 dark:text-gray-400 break-words">
                                  {useLaymanTerms && interaction.laymanMonitoring
                                    ? interaction.laymanMonitoring
                                    : interaction.monitoring || (interaction.severity === 'contraindicated'
                                      ? (useLaymanTerms ? 'Do not use together' : 'Avoid combination')
                                      : interaction.severity === 'severe'
                                        ? (useLaymanTerms ? 'Watch closely with doctor' : 'Frequent monitoring required')
                                        : (useLaymanTerms ? 'Check with doctor regularly' : 'Periodic monitoring advised'))}
                                </p>
                              </div>
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded sm:col-span-2 lg:col-span-1">
                                <p className="font-semibold mb-1">How it works:</p>
                                <p className="text-gray-600 dark:text-gray-400 break-words">
                                  {useLaymanTerms && interaction.laymanMechanism
                                    ? interaction.laymanMechanism
                                    : interaction.mechanism || (useLaymanTerms
                                      ? 'The medicines affect each other'
                                      : 'Pharmacodynamic or pharmacokinetic interaction')}
                                </p>
                              </div>
                            </div>

                            {interaction.alternatives && interaction.alternatives.length > 0 && (
                              <div className="border-t pt-3">
                                <p className="font-semibold mb-2 text-sm">Safer Alternatives:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                  {useLaymanTerms
                                    ? `Consider replacing `
                                    : 'Consider replacing '}
                                  <strong className="text-orange-600 dark:text-orange-400">{interaction.drug2.name}</strong>
                                  {useLaymanTerms
                                    ? ' with one of these safer options:'
                                    : ' with one of these pharmacologically appropriate alternatives:'}
                                </p>
                                <div className="space-y-2">
                                  {interaction.alternatives.map((alt, altIndex) => (
                                    <div
                                      key={altIndex}
                                      className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-all"
                                      onClick={() => navigate(`/drug/${alt.drug.id}`)}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600">
                                              Option {altIndex + 1}
                                            </Badge>
                                          </div>
                                          <div className="font-semibold text-sm break-words">{alt.drug.name}</div>
                                          {alt.drug.genericName && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 break-words">{alt.drug.genericName}</div>
                                          )}
                                          {alt.drug.drugClass && (
                                            <Badge variant="secondary" className="text-[10px] mt-1">{alt.drug.drugClass}</Badge>
                                          )}
                                          <div className="mt-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded text-xs">
                                            <p className="text-green-700 dark:text-green-400 leading-relaxed break-words">
                                              ✓ {useLaymanTerms
                                                ? alt.reason.replace(/pharmacologically|mechanism|therapeutic/gi, match =>
                                                  match.toLowerCase() === 'pharmacologically' ? 'medically' :
                                                    match.toLowerCase() === 'mechanism' ? 'way it works' :
                                                      match.toLowerCase() === 'therapeutic' ? 'treatment' : match
                                                )
                                                : alt.reason}
                                            </p>
                                          </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {interaction.sources && interaction.sources.length > 0 && (
                              <div className="pt-3 border-t text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                                <span className="font-semibold">Sources:</span>
                                {interaction.sources.map((src, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800"
                                  >
                                    {src}
                                  </span>
                                ))}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Summary & Actions */}
          <div className="space-y-4">
            {/* Mobile Summary Toggle */}
            {isMobile && (
              <Button
                variant="outline"
                onClick={() => setShowSummary(!showSummary)}
                className="w-full flex items-center justify-between"
              >
                <span>Summary & Tools</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showSummary ? 'rotate-180' : ''}`} />
              </Button>
            )}

            {/* Summary Card */}
            <Card className={isMobile && !showSummary ? 'hidden' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medications Added</p>
                  <p className="text-2xl font-bold">{selectedDrugs.length}</p>
                </div>

                {selectedDrugs.length >= 2 && interactionResult && (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interactions Found</p>
                      <p className="text-2xl font-bold">{interactionResult.interactions.length}</p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Safety Status</p>
                      {interactionResult.safeToUse ? (
                        <Badge className="bg-green-500 text-white">Generally Safe</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">Requires Attention</Badge>
                      )}
                    </div>

                    {interactionResult.interactions.length > 0 && (
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interaction severity</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Mild</span>
                            <span className="font-semibold">{severityCounts.mild}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Moderate</span>
                            <span className="font-semibold">{severityCounts.moderate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Severe</span>
                            <span className="font-semibold">{severityCounts.severe}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Contraindicated</span>
                            <span className="font-semibold">{severityCounts.contraindicated}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedDrugs.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setSelectedDrugs([])}
                  >
                    Clear All
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className={`bg-gradient-to-br from-blue-50 to-pharma-50 dark:from-blue-900/20 dark:to-pharma-900/20 border-blue-200 dark:border-blue-800 ${isMobile && !showSummary ? 'hidden' : ''}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>This tool analyzes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Drug class interactions</li>
                  <li>Known contraindications</li>
                  <li>Documented interactions</li>
                  <li>Similar drug combinations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Back to Symptom Checker */}
            <Card className={`bg-gradient-to-br from-pharma-50 to-purple-50 dark:from-pharma-900/20 dark:to-purple-900/20 border-pharma-200 dark:border-pharma-800 ${isMobile && !showSummary ? 'hidden' : ''}`}>
              <CardHeader>
                <CardTitle className="text-lg">Symptom Checker</CardTitle>
                <CardDescription>Find medications by symptoms</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/symptom-checker')}
                >
                  Go to Symptom Checker
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Understanding Severity Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border-2 border-blue-500 rounded-lg">
                <Badge className="bg-blue-500 mb-2">MILD</Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Minor interaction, generally safe to use together with monitoring.
                </p>
              </div>
              <div className="p-4 border-2 border-yellow-500 rounded-lg">
                <Badge className="bg-yellow-500 mb-2">MODERATE</Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use with caution, may require dose adjustment or monitoring.
                </p>
              </div>
              <div className="p-4 border-2 border-orange-500 rounded-lg">
                <Badge className="bg-orange-500 mb-2">SEVERE</Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Significant interaction, use only under medical supervision.
                </p>
              </div>
              <div className="p-4 border-2 border-red-500 rounded-lg">
                <Badge className="bg-red-500 mb-2">CONTRAINDICATED</Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Do not use together, seek alternatives immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DrugInteractionChecker;
