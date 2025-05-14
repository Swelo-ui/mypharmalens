
import { DrugData } from "@/components/DrugCard";

// Central Nervous System drugs - includes antidepressants, anxiolytics, sedatives, and analgesics
export const centralNervousDrugs: DrugData[] = [
  // Antidepressants
  {
    id: '17',
    name: 'Citalopram',
    genericName: 'Citalopram',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Celexa']
  },
  {
    id: '18',
    name: 'Sertraline',
    genericName: 'Sertraline',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression, OCD, and anxiety',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Zoloft']
  },
  {
    id: '29',
    name: 'Fluoxetine',
    genericName: 'Fluoxetine',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'SSRI antidepressant used to treat depression, OCD, and bulimia',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Prozac']
  },
  {
    id: '30',
    name: 'Trazodone',
    genericName: 'Trazodone',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Antidepressant and sedative used to treat depression and insomnia',
    drugClass: 'Antidepressant',
    verified: true,
    brandNames: ['Desyrel']
  },
  {
    id: '117',
    name: 'Venlafaxine',
    genericName: 'Venlafaxine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat major depressive disorder, anxiety, and panic disorder.',
    drugClass: 'SNRI',
    verified: true,
    brandNames: ['Effexor', 'Effexor XR']
  },
  {
    id: '118',
    name: 'Duloxetine',
    genericName: 'Duloxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression, anxiety disorders, fibromyalgia, and diabetic neuropathy.',
    drugClass: 'SNRI',
    verified: true,
    brandNames: ['Cymbalta']
  },
  {
    id: '119',
    name: 'Paroxetine',
    genericName: 'Paroxetine hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression, panic attacks, obsessive-compulsive disorder, anxiety disorders, and post-traumatic stress disorder.',
    drugClass: 'SSRI',
    verified: true,
    brandNames: ['Paxil', 'Paxil CR', 'Pexeva']
  },
  {
    id: '120',
    name: 'Bupropion',
    genericName: 'Bupropion hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Aminoketone antidepressant used to treat depression and seasonal affective disorder, and as an aid to smoking cessation treatment.',
    drugClass: 'Aminoketone',
    verified: true,
    brandNames: ['Wellbutrin', 'Wellbutrin SR', 'Wellbutrin XL', 'Zyban']
  },
  {
    id: '235',
    name: 'Mirtazapine',
    genericName: 'Mirtazapine',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Tetracyclic antidepressant used to treat depression.',
    drugClass: 'Tetracyclic antidepressant',
    verified: true,
    brandNames: ['Remeron']
  },
  {
    id: '236',
    name: 'Trazodone',
    genericName: 'Trazodone hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin antagonist and reuptake inhibitor used to treat depression and insomnia.',
    drugClass: 'Serotonin antagonist and reuptake inhibitor',
    verified: true,
    brandNames: ['Desyrel', 'Oleptro']
  },
  {
    id: '237',
    name: 'Desvenlafaxine',
    genericName: 'Desvenlafaxine succinate',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin-norepinephrine reuptake inhibitor used to treat depression.',
    drugClass: 'SNRI',
    verified: true,
    brandNames: ['Pristiq', 'Khedezla']
  },
  {
    id: '238',
    name: 'Vilazodone',
    genericName: 'Vilazodone hydrochloride',
    manufacturer: 'Various',
    category: 'Antidepressant',
    description: 'Serotonin reuptake inhibitor and 5-HT1A partial agonist used to treat depression.',
    drugClass: 'SSRI/5-HT1A partial agonist',
    verified: true,
    brandNames: ['Viibryd']
  },
  
  // Antipsychotics
  {
    id: '121',
    name: 'Olanzapine',
    genericName: 'Olanzapine',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia and bipolar disorder.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    brandNames: ['Zyprexa', 'Zyprexa Zydis']
  },
  {
    id: '122',
    name: 'Quetiapine',
    genericName: 'Quetiapine fumarate',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, and as add-on treatment for major depressive disorder.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    brandNames: ['Seroquel', 'Seroquel XR']
  },
  {
    id: '123',
    name: 'Aripiprazole',
    genericName: 'Aripiprazole',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia, bipolar disorder, major depressive disorder, and irritability associated with autism.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    brandNames: ['Abilify', 'Abilify Maintena', 'Aristada']
  },
  {
    id: '124',
    name: 'Ziprasidone',
    genericName: 'Ziprasidone hydrochloride',
    manufacturer: 'Various',
    category: 'Antipsychotic',
    description: 'Atypical antipsychotic used to treat schizophrenia and acute episodes of bipolar mania.',
    drugClass: 'Atypical antipsychotic',
    verified: true,
    brandNames: ['Geodon']
  },
  
  // Anxiolytics
  {
    id: '31',
    name: 'Clonazepam',
    genericName: 'Clonazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety and seizures',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Klonopin']
  },
  {
    id: '32',
    name: 'Alprazolam',
    genericName: 'Alprazolam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety and panic disorder',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Xanax']
  },
  {
    id: '125',
    name: 'Lorazepam',
    genericName: 'Lorazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat anxiety disorders, trouble sleeping, active seizures, and alcohol withdrawal.',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Ativan']
  },
  {
    id: '126',
    name: 'Clonazepam',
    genericName: 'Clonazepam',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Benzodiazepine used to treat panic disorder, anxiety disorders, and seizures.',
    drugClass: 'Benzodiazepine',
    verified: true,
    brandNames: ['Klonopin']
  },
  {
    id: '127',
    name: 'Buspirone',
    genericName: 'Buspirone hydrochloride',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Anxiolytic medication used to treat anxiety disorders.',
    drugClass: 'Azapirone',
    verified: true,
    brandNames: ['BuSpar']
  },
  {
    id: '128',
    name: 'Hydroxyzine',
    genericName: 'Hydroxyzine hydrochloride',
    manufacturer: 'Various',
    category: 'Anxiolytic',
    description: 'Antihistamine with anxiolytic properties used to treat anxiety, nausea and vomiting, and severe itching.',
    drugClass: 'Antihistamine',
    verified: true,
    brandNames: ['Atarax', 'Vistaril']
  },
  
  // Sedatives and sleep aids
  {
    id: '33',
    name: 'Zolpidem',
    genericName: 'Zolpidem',
    manufacturer: 'Various',
    category: 'Sedative',
    description: 'Sedative used to treat insomnia',
    drugClass: 'Sedative',
    verified: true,
    brandNames: ['Ambien']
  },
  
  // Analgesics
  {
    id: '19',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, fever, and inflammation',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Advil', 'Motrin']
  },
  {
    id: '20',
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Analgesic and antipyretic used to treat pain and fever',
    drugClass: 'Analgesic',
    verified: true,
    brandNames: ['Tylenol']
  },
  {
    id: '21',
    name: 'Hydrocodone/Acetaminophen',
    genericName: 'Hydrocodone/Acetaminophen',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Vicodin', 'Norco']
  },
  {
    id: '22',
    name: 'Tramadol',
    genericName: 'Tramadol',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Ultram']
  },
  {
    id: '67',
    name: 'Meloxicam',
    genericName: 'Meloxicam',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Mobic']
  },
  {
    id: '68',
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    manufacturer: 'Various',
    category: 'Neurologic',
    description: 'Anticonvulsant used to treat seizures and nerve pain',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Neurontin']
  },
  {
    id: '69',
    name: 'Pregabalin',
    genericName: 'Pregabalin',
    manufacturer: 'Various',
    category: 'Neurologic',
    description: 'Anticonvulsant used to treat seizures and nerve pain',
    drugClass: 'Anticonvulsant',
    verified: true,
    brandNames: ['Lyrica']
  },
  {
    id: '70',
    name: 'Cyclobenzaprine',
    genericName: 'Cyclobenzaprine',
    manufacturer: 'Various',
    category: 'Muscle Relaxant',
    description: 'Muscle relaxant used to treat muscle spasms',
    drugClass: 'Muscle Relaxant',
    verified: true,
    brandNames: ['Flexeril']
  },
  {
    id: '71',
    name: 'Tizanidine',
    genericName: 'Tizanidine',
    manufacturer: 'Various',
    category: 'Muscle Relaxant',
    description: 'Muscle relaxant used to treat muscle spasms',
    drugClass: 'Muscle Relaxant',
    verified: true,
    brandNames: ['Zanaflex']
  },
  {
    id: '72',
    name: 'Oxycodone',
    genericName: 'Oxycodone',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat moderate to severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['OxyContin']
  },
  {
    id: '73',
    name: 'Morphine',
    genericName: 'Morphine',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat severe pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['MS Contin']
  },
  {
    id: '74',
    name: 'Codeine',
    genericName: 'Codeine',
    manufacturer: 'Various',
    category: 'Analgesic',
    description: 'Opioid analgesic used to treat mild to moderate pain',
    drugClass: 'Opioid Analgesic',
    verified: true,
    brandNames: ['Various']
  },
  {
    id: '129',
    name: 'Naproxen',
    genericName: 'Naproxen',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, fever, inflammation, and stiffness.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Aleve', 'Naprosyn', 'Anaprox']
  },
  {
    id: '130',
    name: 'Meloxicam',
    genericName: 'Meloxicam',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation caused by osteoarthritis and rheumatoid arthritis.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Mobic', 'Vivlodex']
  },
  {
    id: '218',
    name: 'Celecoxib',
    genericName: 'Celecoxib',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'COX-2 selective nonsteroidal anti-inflammatory drug used to treat pain and inflammation.',
    drugClass: 'COX-2 inhibitor',
    verified: true,
    brandNames: ['Celebrex']
  },
  {
    id: '219',
    name: 'Diclofenac',
    genericName: 'Diclofenac sodium',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain and inflammation.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Voltaren', 'Cataflam', 'Zipsor']
  },
  {
    id: '220',
    name: 'Indomethacin',
    genericName: 'Indomethacin',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used to treat pain, inflammation, and fever.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Indocin', 'Tivorbex']
  },
  {
    id: '221',
    name: 'Ketorolac',
    genericName: 'Ketorolac tromethamine',
    manufacturer: 'Various',
    category: 'Anti-inflammatory',
    description: 'NSAID used for short-term management of moderate to severe pain.',
    drugClass: 'NSAID',
    verified: true,
    brandNames: ['Toradol', 'Sprix', 'Acular']
  }
];
