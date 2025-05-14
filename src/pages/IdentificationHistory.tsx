
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { combinedDrugsData, searchDrugs } from '@/data/combinedDrugsData';

interface ConditionCategory {
  title: string;
  titleHindi: string;
  conditions: Condition[];
}

interface Condition {
  name: string;
  nameHindi: string;
  description?: string;
  icon?: React.ReactNode;
  relatedDrugs: string[];
}

const SelfCarePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const navigate = useNavigate();

  // Define the categories and conditions
  const categories: ConditionCategory[] = [
    {
      title: "Pain",
      titleHindi: "Dard",
      conditions: [
        { 
          name: "Headache", 
          nameHindi: "Sar dard",
          relatedDrugs: ["paracetamol", "ibuprofen", "aspirin"] 
        },
        { 
          name: "Back pain", 
          nameHindi: "Peeth dard",
          relatedDrugs: ["diclofenac", "naproxen", "ibuprofen"] 
        },
        { 
          name: "Joint pain", 
          nameHindi: "Jod dard",
          relatedDrugs: ["diclofenac", "naproxen", "ibuprofen"] 
        },
        { 
          name: "Stomach ache", 
          nameHindi: "Pet dard",
          relatedDrugs: ["omeprazole", "pantoprazole", "ranitidine"] 
        },
        { 
          name: "Menstrual cramps", 
          nameHindi: "Mahilaon ka dard",
          relatedDrugs: ["mefenamic acid", "ibuprofen", "diclofenac"] 
        },
      ]
    },
    {
      title: "Fever",
      titleHindi: "Bukhar",
      conditions: [
        { 
          name: "General fever", 
          nameHindi: "Sadharan bukhar",
          relatedDrugs: ["paracetamol", "ibuprofen", "aspirin"] 
        },
        { 
          name: "Viral fever", 
          nameHindi: "Viral bukhar",
          relatedDrugs: ["paracetamol", "ibuprofen"] 
        },
        { 
          name: "Typhoid/Malaria symptoms", 
          nameHindi: "Typhoid/Malaria jaise lakshan",
          relatedDrugs: ["chloroquine", "paracetamol", "ciprofloxacin"] 
        },
      ]
    },
    {
      title: "Cold",
      titleHindi: "Jhukhaam",
      conditions: [
        { 
          name: "Runny nose", 
          nameHindi: "Naak bahna",
          relatedDrugs: ["cetirizine", "loratadine", "pseudoephedrine"] 
        },
        { 
          name: "Nasal congestion", 
          nameHindi: "Nazar band hona",
          relatedDrugs: ["xylometazoline", "oxymetazoline", "pseudoephedrine"] 
        },
      ]
    },
    {
      title: "Cough",
      titleHindi: "Khansi",
      conditions: [
        { 
          name: "Dry cough", 
          nameHindi: "Sookhi khansi",
          relatedDrugs: ["dextromethorphan", "codeine", "bromhexine"] 
        },
        { 
          name: "Wet cough", 
          nameHindi: "Bheeni khansi",
          relatedDrugs: ["ambroxol", "guaifenesin", "bromhexine"] 
        },
      ]
    },
    {
      title: "Breathing issues",
      titleHindi: "Saans lene mein dikkat",
      conditions: [
        { 
          name: "Mild asthma", 
          nameHindi: "Halka dama",
          relatedDrugs: ["salbutamol", "terbutaline", "budesonide"] 
        },
        { 
          name: "Allergy-related breathing problem", 
          nameHindi: "Allergy se saans ki dikkat",
          relatedDrugs: ["cetirizine", "montelukast", "loratadine"] 
        },
      ]
    },
    {
      title: "Nausea & Vomiting",
      titleHindi: "Matli aur Ulti",
      conditions: [
        { 
          name: "Feeling like vomiting", 
          nameHindi: "Ulti ka man",
          relatedDrugs: ["domperidone", "ondansetron", "metoclopramide"] 
        },
        { 
          name: "Vomiting", 
          nameHindi: "Ulti hona",
          relatedDrugs: ["ondansetron", "domperidone", "metoclopramide"] 
        },
      ]
    },
    {
      title: "Stomach problems",
      titleHindi: "Pet ki samasyaayein",
      conditions: [
        { 
          name: "Gas / Bloating", 
          nameHindi: "Gas / Pet phulna",
          relatedDrugs: ["simethicone", "activated charcoal", "antacids"] 
        },
        { 
          name: "Acidity / Heartburn", 
          nameHindi: "Acidity / Jalna",
          relatedDrugs: ["omeprazole", "pantoprazole", "ranitidine", "antacids"] 
        },
        { 
          name: "Diarrhea", 
          nameHindi: "Dast",
          relatedDrugs: ["loperamide", "oral rehydration solutions", "probiotics"] 
        },
        { 
          name: "Constipation", 
          nameHindi: "Kabj",
          relatedDrugs: ["lactulose", "bisacodyl", "ispaghula"] 
        },
      ]
    },
    {
      title: "Allergy & Skin Problems",
      titleHindi: "Allergy aur Twacha ki samasyaayein",
      conditions: [
        { 
          name: "Sneezing from allergy", 
          nameHindi: "Allergy wali chhink",
          relatedDrugs: ["cetirizine", "loratadine", "fexofenadine"] 
        },
        { 
          name: "Mild skin rashes", 
          nameHindi: "Twacha par halke danay",
          relatedDrugs: ["calamine", "hydrocortisone", "antihistamines"] 
        },
        { 
          name: "Itching", 
          nameHindi: "Khujli",
          relatedDrugs: ["cetirizine", "calamine", "hydrocortisone"] 
        },
        { 
          name: "Fungal Infections", 
          nameHindi: "Daad / Khujli / Fungal infection",
          relatedDrugs: ["clotrimazole", "miconazole", "fluconazole"] 
        },
      ]
    },
    {
      title: "Diabetes (basic support only)",
      titleHindi: "Sugar ka rog – basic level",
      conditions: [
        { 
          name: "High/low sugar control", 
          nameHindi: "Blood sugar ka high ya low hona – samanya",
          relatedDrugs: ["metformin", "glimepiride", "insulin"] 
        },
      ]
    },
    {
      title: "Blood Pressure Issues (basic support only)",
      titleHindi: "BP ki samasya – mamuli",
      conditions: [
        { 
          name: "High BP", 
          nameHindi: "High BP",
          relatedDrugs: ["amlodipine", "enalapril", "losartan"] 
        },
        { 
          name: "Low BP", 
          nameHindi: "Low BP",
          relatedDrugs: ["fludrocortisone", "midodrine"] 
        },
      ]
    },
    {
      title: "Cholesterol & Digestion",
      titleHindi: "Cholesterol aur Pachan samasyaayein",
      conditions: [
        { 
          name: "Mild cholesterol imbalance", 
          nameHindi: "Halka bad cholesterol",
          relatedDrugs: ["statins", "fibrates", "omega-3"] 
        },
        { 
          name: "Fatty food issues", 
          nameHindi: "Bari khane ke baad pet ki samasya",
          relatedDrugs: ["pancreatic enzymes", "simethicone"] 
        },
      ]
    },
    {
      title: "Fatigue & Weakness",
      titleHindi: "Thakan / Kamzori",
      conditions: [
        { 
          name: "Vitamin deficiency", 
          nameHindi: "Vitamin ki kami",
          relatedDrugs: ["multivitamins", "vitamin b complex", "vitamin c", "vitamin d"] 
        },
        { 
          name: "Iron deficiency", 
          nameHindi: "Iron ki kami",
          relatedDrugs: ["ferrous sulfate", "folic acid", "iron supplements"] 
        },
      ]
    },
    {
      title: "Sleep & Stress",
      titleHindi: "Neend aur Tanav",
      conditions: [
        { 
          name: "Sleeplessness", 
          nameHindi: "Neend na aana",
          relatedDrugs: ["melatonin", "diphenhydramine", "herbal sleep aids"] 
        },
        { 
          name: "Mild anxiety", 
          nameHindi: "Halki bechaini",
          relatedDrugs: ["herbal supplements", "mild anxiolytics"] 
        },
        { 
          name: "Everyday stress", 
          nameHindi: "Rozmarra ka tanav",
          relatedDrugs: ["adaptogens", "herbal supplements"] 
        },
      ]
    },
    {
      title: "Urinary problems (common)",
      titleHindi: "Peshab ki samanya samasyaayein",
      conditions: [
        { 
          name: "Frequent urination", 
          nameHindi: "Peshab zyada aana",
          relatedDrugs: ["tolterodine", "oxybutynin"] 
        },
        { 
          name: "Burning sensation", 
          nameHindi: "Peshab mein jalan",
          relatedDrugs: ["antibiotics", "urinary analgesics", "cranberry supplements"] 
        },
      ]
    },
    {
      title: "Children's common problems",
      titleHindi: "Bachchon ki aam samasyaayein",
      conditions: [
        { 
          name: "Fever, cough, cold", 
          nameHindi: "Bukhar, khansi, jhukhaam",
          relatedDrugs: ["paediatric paracetamol", "paediatric ibuprofen", "paediatric antihistamines"] 
        },
        { 
          name: "Mild stomach ache", 
          nameHindi: "Halke pet dard",
          relatedDrugs: ["paediatric antacids", "paediatric antispasmodics"] 
        },
        { 
          name: "Teething issues", 
          nameHindi: "Daat nikalna",
          relatedDrugs: ["teething gels", "paediatric pain relievers"] 
        },
      ]
    },
  ];

  // Filter conditions based on search
  const filteredCategories = categories.filter(category => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if category title matches
    if (category.title.toLowerCase().includes(searchLower) || 
        category.titleHindi.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check if any condition in the category matches
    return category.conditions.some(condition => 
      condition.name.toLowerCase().includes(searchLower) || 
      condition.nameHindi.toLowerCase().includes(searchLower)
    );
  });

  // Get related drugs for a condition
  const getRelatedDrugs = (drugNames: string[]) => {
    return combinedDrugsData.filter(drug => {
      const drugNameLower = drug.name.toLowerCase();
      const genericNameLower = drug.genericName?.toLowerCase() || '';
      
      return drugNames.some(name => 
        drugNameLower.includes(name.toLowerCase()) || 
        genericNameLower.includes(name.toLowerCase()) ||
        (drug.brandNames && drug.brandNames.some(brand => 
          brand.toLowerCase().includes(name.toLowerCase())
        ))
      );
    });
  };

  // Handle condition click
  const handleConditionClick = (condition: Condition) => {
    setSelectedCondition(condition);
  };

  // Reset selected condition
  const handleBackToList = () => {
    setSelectedCondition(null);
  };

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Self Care</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Find medications for common conditions and symptoms
            </p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search conditions..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {selectedCondition ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleBackToList} className="text-pharma-600">
                &larr; Back to conditions
              </Button>
              <h2 className="text-xl font-semibold">{selectedCondition.name}</h2>
              <Badge variant="outline" className="ml-2">
                {selectedCondition.nameHindi}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRelatedDrugs(selectedCondition.relatedDrugs).length > 0 ? (
                getRelatedDrugs(selectedCondition.relatedDrugs).map(drug => (
                  <Card 
                    key={drug.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/drug/${drug.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{drug.name}</CardTitle>
                      {drug.genericName && (
                        <CardDescription>{drug.genericName}</CardDescription>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {drug.category && (
                          <Badge variant="outline" className="bg-pharma-50 text-pharma-600 border-pharma-200">
                            {drug.category}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {drug.image ? (
                        <div className="w-full h-32 rounded-md overflow-hidden mb-3">
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={drug.image} 
                              alt={drug.name} 
                              className="object-cover w-full h-full"
                            />
                          </AspectRatio>
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-md overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Pill className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {drug.description || "Click for more details about this medication."}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No medications found</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    We couldn't find medications specifically for this condition in our database.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{category.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.titleHindi}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.conditions.map((condition, i) => (
                      <li key={i}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-left hover:bg-pharma-50 hover:text-pharma-700"
                          onClick={() => handleConditionClick(condition)}
                        >
                          <div className="flex flex-col items-start">
                            <span>{condition.name}</span>
                            <span className="text-xs text-gray-500">{condition.nameHindi}</span>
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                            {getRelatedDrugs(condition.relatedDrugs).length} medications
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            {filteredCategories.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                  <Search className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">No conditions found</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  No conditions match your search criteria. Try a different search term.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SelfCarePage;
