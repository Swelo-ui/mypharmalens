import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, X, Plus, Shield, Info, ArrowRight, ExternalLink, ChevronDown } from 'lucide-react';
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
// Removed popover/command UI to use inline, mobile-friendly list

const DrugInteractionChecker = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [allDrugs, setAllDrugs] = useState<DrugData[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<DrugData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionCheckResult | null>(null);
  // Inline list state
  const [showSummary, setShowSummary] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
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
      : (showAll ? allDrugs.slice().sort((a,b) => a.name.localeCompare(b.name)) : []);
    return list.slice(0, page * pageSize);
  })();

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
      <Header />
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Drug Interaction Checker</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                Check interactions between medications for safe usage
              </p>
            </div>
            {allDrugs.length > 0 && (
              <div className="flex items-center gap-2 bg-pharma-50 dark:bg-pharma-900/20 px-3 py-2 rounded-lg">
                <Shield className="h-4 w-4 text-pharma-600" />
                <span className="text-sm font-medium text-pharma-700 dark:text-pharma-300">
                  {allDrugs.length.toLocaleString()} medications available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Important Safety Information</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
            This tool provides general information about drug interactions. It does not replace professional medical advice.
            Always consult your healthcare provider before starting, stopping, or changing medications.
          </AlertDescription>
        </Alert>

        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
          {/* Left Panel - Drug Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Drug Card */}
            <Card>
              <CardHeader>
                <CardTitle>Add Medications</CardTitle>
                <CardDescription>Search and add medications you're currently taking or planning to take</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search medications..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                    />
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
                        <div key={drug.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/50">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{drug.name}</div>
                            {drug.genericName && (
                              <div className="text-xs text-gray-500 truncate">{drug.genericName}</div>
                            )}
                            {drug.drugClass && (
                              <div className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{drug.drugClass}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/drug/${drug.id}`)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleAddDrug(drug)}>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Interaction Analysis
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
                          className={`border-2 ${getSeverityColor(interaction.severity)}`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {interaction.drug1.name} ↔ {interaction.drug2.name}
                            </span>
                            <Badge className={getSeverityBadgeColor(interaction.severity)}>
                              {getSeverityLabel(interaction.severity)}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription className="space-y-3">
                            <div>
                              <p className="font-medium mb-1">Description:</p>
                              <p className="text-sm">{interaction.description}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium mb-1">Recommendation:</p>
                              <p className="text-sm">{interaction.recommendation}</p>
                            </div>

                            {interaction.alternatives && interaction.alternatives.length > 0 && (
                              <div>
                                <p className="font-medium mb-2">Alternative Medications:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                  Consider replacing <strong>{interaction.drug2.name}</strong> with one of these alternatives:
                                </p>
                                <div className="space-y-2">
                                  {interaction.alternatives.map((alt, altIndex) => (
                                    <div
                                      key={altIndex}
                                      className="p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-pharma-300 transition-colors"
                                      onClick={() => navigate(`/drug/${alt.drug.id}`)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                                              Alternative #{altIndex + 1}
                                            </Badge>
                                          </div>
                                          <div className="font-medium mt-1">{alt.drug.name}</div>
                                          {alt.drug.genericName && (
                                            <div className="text-xs text-gray-500">{alt.drug.genericName}</div>
                                          )}
                                          {alt.drug.drugClass && (
                                            <Badge variant="secondary" className="text-[10px] mt-1">{alt.drug.drugClass}</Badge>
                                          )}
                                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                            ✓ {alt.reason}
                                          </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
