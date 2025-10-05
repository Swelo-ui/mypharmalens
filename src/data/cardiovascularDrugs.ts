
import { DrugData } from "@/components/DrugCard";

// Cardiovascular drugs - includes antihypertensives, anticoagulants, antiplatelets, and statins
export const cardiovascularDrugs: DrugData[] = [
  // Antihypertensives (drugs 1-5, 101-104, 200-206)
  {
    id: '1',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Prinivil', 'Zestril']
  },
  {
    id: '2',
    name: 'Enalapril',
    genericName: 'Enalapril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Vasotec']
  },
  {
    id: '3',
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure and angina',
    drugClass: 'Calcium channel blocker',
    verified: true,
    brandNames: ['Norvasc']
  },
  {
    id: '4',
    name: 'Metoprolol',
    genericName: 'Metoprolol',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker used to treat high blood pressure, angina, and heart failure',
    drugClass: 'Beta Blocker',
    verified: true,
    brandNames: ['Lopressor', 'Toprol XL']
  },
  {
    id: '5',
    name: 'Losartan',
    genericName: 'Losartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin receptor blocker used to treat high blood pressure and reduce the risk of stroke',
    drugClass: 'Angiotensin Receptor Blocker',
    verified: true,
    brandNames: ['Cozaar']
  },
  {
    id: '101',
    name: 'Enalapril',
    genericName: 'Enalapril maleate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to prevent kidney problems in people with diabetes.',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Vasotec', 'Epaned']
  },
  {
    id: '102',
    name: 'Atenolol',
    genericName: 'Atenolol',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker that affects the heart and circulation. Used to treat angina and high blood pressure.',
    drugClass: 'Beta blocker',
    verified: true,
    brandNames: ['Tenormin']
  },
  {
    id: '103',
    name: 'Diltiazem',
    genericName: 'Diltiazem hydrochloride',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure, angina, and certain heart rhythm disorders.',
    drugClass: 'Calcium channel blocker',
    verified: true,
    brandNames: ['Cardizem', 'Cartia XT', 'Tiazac']
  },
  {
    id: '104',
    name: 'Verapamil',
    genericName: 'Verapamil hydrochloride',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Calcium channel blocker used to treat high blood pressure, angina, and certain heart rhythm disorders.',
    drugClass: 'Calcium channel blocker',
    verified: true,
    brandNames: ['Calan', 'Verelan', 'Isoptin SR']
  },
  {
    id: '200',
    name: 'Bisoprolol',
    genericName: 'Bisoprolol fumarate',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Beta-blocker used to treat high blood pressure and heart failure.',
    drugClass: 'Beta blocker',
    verified: true,
    brandNames: ['Zebeta', 'Concor']
  },
  {
    id: '201',
    name: 'Ramipril',
    genericName: 'Ramipril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'ACE inhibitor used to treat high blood pressure, heart failure, and to reduce the risk of cardiovascular events.',
    drugClass: 'ACE inhibitor',
    verified: true,
    brandNames: ['Altace', 'Ramace']
  },
  {
    id: '202',
    name: 'Candesartan',
    genericName: 'Candesartan cilexetil',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and heart failure.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Atacand', 'Blopress']
  },
  {
    id: '203',
    name: 'Irbesartan',
    genericName: 'Irbesartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and diabetic nephropathy.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Avapro', 'Aprovel']
  },
  {
    id: '204',
    name: 'Telmisartan',
    genericName: 'Telmisartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Angiotensin II receptor antagonist used to treat high blood pressure and reduce cardiovascular risk.',
    drugClass: 'Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Micardis', 'Pritor']
  },
  {
    id: '205',
    name: 'Hydrochlorothiazide/Lisinopril',
    genericName: 'Hydrochlorothiazide/Lisinopril',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Combination of a thiazide diuretic and an ACE inhibitor used to treat high blood pressure.',
    drugClass: 'ACE inhibitor/Thiazide diuretic',
    verified: true,
    brandNames: ['Zestoretic', 'Prinzide']
  },
  {
    id: '206',
    name: 'Amlodipine/Valsartan',
    genericName: 'Amlodipine/Valsartan',
    manufacturer: 'Various',
    category: 'Antihypertensive',
    description: 'Combination of a calcium channel blocker and an angiotensin II receptor antagonist used to treat high blood pressure.',
    drugClass: 'Calcium channel blocker/Angiotensin II receptor antagonist',
    verified: true,
    brandNames: ['Exforge', 'Amlovas']
  },
  
  // Anticoagulants and Antiplatelets (drugs 23-25)
  {
    id: '23',
    name: 'Warfarin',
    genericName: 'Warfarin',
    manufacturer: 'Various',
    category: 'Anticoagulant',
    description: 'Anticoagulant used to prevent blood clots',
    drugClass: 'Anticoagulant',
    verified: true,
    brandNames: ['Coumadin']
  },
  {
    id: '24',
    name: 'Clopidogrel',
    genericName: 'Clopidogrel',
    manufacturer: 'Various',
    category: 'Antiplatelet',
    description: 'Antiplatelet drug used to prevent blood clots',
    drugClass: 'Antiplatelet',
    verified: true,
    brandNames: ['Plavix']
  },
  {
    id: '25',
    name: 'Aspirin',
    genericName: 'Aspirin',
    manufacturer: 'Various',
    category: 'Antiplatelet',
    description: 'Antiplatelet drug used to prevent blood clots and reduce the risk of heart attack and stroke',
    drugClass: 'Antiplatelet',
    verified: true,
    brandNames: ['Bayer', 'Ecotrin']
  },
  
  // Antilipemics (drugs 6, 7, 231-234)
  {
    id: '6',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Statin used to lower cholesterol and reduce the risk of heart disease',
    drugClass: 'Statin',
    verified: true,
    brandNames: ['Lipitor']
  },
  {
    id: '7',
    name: 'Simvastatin',
    genericName: 'Simvastatin',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Statin used to lower cholesterol and reduce the risk of heart disease',
    drugClass: 'Statin',
    verified: true,
    brandNames: ['Zocor']
  },
  {
    id: '231',
    name: 'Rosuvastatin',
    genericName: 'Rosuvastatin calcium',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'HMG-CoA reductase inhibitor used to lower cholesterol and prevent cardiovascular disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    brandNames: ['Crestor']
  },
  {
    id: '232',
    name: 'Pravastatin',
    genericName: 'Pravastatin sodium',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'HMG-CoA reductase inhibitor used to lower cholesterol and prevent cardiovascular disease.',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    verified: true,
    brandNames: ['Pravachol', 'Lipostat']
  },
  {
    id: '233',
    name: 'Ezetimibe',
    genericName: 'Ezetimibe',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Cholesterol absorption inhibitor used to lower cholesterol.',
    drugClass: 'Cholesterol absorption inhibitor',
    verified: true,
    brandNames: ['Zetia', 'Ezetrol']
  },
  {
    id: '234',
    name: 'Fenofibrate',
    genericName: 'Fenofibrate',
    manufacturer: 'Various',
    category: 'Antilipemic',
    description: 'Fibric acid derivative used to lower triglycerides and cholesterol.',
    drugClass: 'Fibric acid derivative',
    verified: true,
    brandNames: ['Tricor', 'Fenoglide', 'Antara']
  }
];
