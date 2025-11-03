import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Pill, ChevronDown, ChevronRight, ArrowRight, Filter, Eye, X } from 'lucide-react';
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
import { toast } from 'sonner';

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
      // Headache
      if (name.includes('headache')) {
        addClass('nsaid', 60);
        addClass('anti-inflammatory', 30);
        addClass('analgesic', 20);
        addClass('triptan', 50);
        ['ibuprofen','naproxen','diclofenac','paracetamol','acetaminophen','sumatriptan','rizatriptan']
          .forEach(n => addName(n, 40));
        // Deprioritize opioids/combos/topicals for primary headache treatment
        addNegClass('opioid', 60);
        addNegClass('opioid analgesic', 60);
        addNegName('tramadol', 60);
        addNegClass('topical', 30);
        addNegName('spray', 25);
        addNegName('gel', 25);
      }
      // Anxiety
      if (name.includes('anxiety') || name.includes('nervous')) {
        addClass('benzodiazepine', 60);
        addClass('ssri', 25);
        addClass('anxiolytic', 60);
        ['alprazolam','lorazepam','clonazepam','diazepam']
          .forEach(n => addName(n, 40));
        ['sertraline','paroxetine','fluoxetine','escitalopram']
          .forEach(n => addName(n, 25));
        // Reduce unrelated sedatives dominance (e.g., antihistamines)
        addNegClass('antihistamine', 20);
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

  // Filter symptoms based on search
  const filteredCategories = symptomCategories.map(category => ({
    ...category,
    symptoms: category.symptoms.filter(symptom =>
      symptom.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symptom.nameHi.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.symptoms.length > 0);

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Symptom-Based Drug Search</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                Find medications based on your symptoms
              </p>
            </div>
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
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                        <span className="text-2xl">{category.icon}</span>
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
                              className={`p-3 rounded-lg border transition-all ${
                                isSelected
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
