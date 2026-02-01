// Janaushadhi Data Import Function
// One-time import of government generic medicine data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Janaushadhi medicine data (extracted from CSV)
const JANAUSHADHI_DATA = [
    { drug_code: "1", generic_name: "Aceclofenac 100mg and Paracetamol 325mg Tablets", mrp: 9.38, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Aceclofenac", strength: "100mg", formulation: "Tablets" },
    { drug_code: "2", generic_name: "Aceclofenac Tablets IP 100 mg", mrp: 7.5, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Aceclofenac", strength: "100mg", formulation: "Tablets" },
    { drug_code: "3", generic_name: "Pregabalin Capsules IP 75 mg", mrp: 20.63, category: "Central Nervous System (CNS)", primary_ingredient: "Pregabalin", strength: "75mg", formulation: "Capsules" },
    { drug_code: "5", generic_name: "Aspirin Gastro-resistant Tablets IP 150 mg", mrp: 4.69, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Aspirin", strength: "150mg", formulation: "Tablets" },
    { drug_code: "18", generic_name: "Azithromycin Tablets IP 250 mg", mrp: 42.19, category: "Antibiotics", primary_ingredient: "Azithromycin", strength: "250mg", formulation: "Tablets" },
    { drug_code: "19", generic_name: "Nimesulide 100mg and Paracetamol 325mg Tablets", mrp: 10.32, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Nimesulide", strength: "100mg", formulation: "Tablets" },
    { drug_code: "23", generic_name: "Paracetamol Tablets IP 500 mg", mrp: 6.57, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Paracetamol", strength: "500mg", formulation: "Tablets" },
    { drug_code: "72", generic_name: "Azithromycin Tablets IP 500 mg", mrp: 39.38, category: "Antibiotics", primary_ingredient: "Azithromycin", strength: "500mg", formulation: "Tablets" },
    { drug_code: "145", generic_name: "Metformin Hydrochloride Tablets IP 500mg", mrp: 6.19, category: "Anti-Diabetic", primary_ingredient: "Metformin", strength: "500mg", formulation: "Tablets" },
    { drug_code: "186", generic_name: "Domperidone Tablets IP 10 mg", mrp: 4.13, category: "Anti-Emetic", primary_ingredient: "Domperidone", strength: "10mg", formulation: "Tablets" },
    { drug_code: "207", generic_name: "Omeprazole Gastro-resistant Capsules IP 20 mg", mrp: 9.29, category: "Gastrointestinal (GIT)", primary_ingredient: "Omeprazole", strength: "20mg", formulation: "Capsules" },
    { drug_code: "212", generic_name: "Pantoprazole Gastro Resistant Tablets IP 40 mg", mrp: 11.35, category: "Gastrointestinal (GIT)", primary_ingredient: "Pantoprazole", strength: "40mg", formulation: "Tablets" },
    { drug_code: "215", generic_name: "Rabeprazole Gastro Resistant Tablets IP 20 mg", mrp: 8.25, category: "Gastrointestinal (GIT)", primary_ingredient: "Rabeprazole", strength: "20mg", formulation: "Tablets" },
    { drug_code: "264", generic_name: "Amlodipine Tablets IP 5mg", mrp: 5.16, category: "Cardiovascular System (CVS)", primary_ingredient: "Amlodipine", strength: "5mg", formulation: "Tablets" },
    { drug_code: "265", generic_name: "Atenolol Tablets IP 50 mg", mrp: 6.19, category: "Cardiovascular System (CVS)", primary_ingredient: "Atenolol", strength: "50mg", formulation: "Tablets" },
    { drug_code: "267", generic_name: "Atorvastatin Tablets IP 10mg", mrp: 8.25, category: "Cardiovascular System (CVS)", primary_ingredient: "Atorvastatin", strength: "10mg", formulation: "Tablets" },
    { drug_code: "269", generic_name: "Clopidogrel Tablets IP 75mg", mrp: 17.54, category: "Cardiovascular System (CVS)", primary_ingredient: "Clopidogrel", strength: "75mg", formulation: "Tablets" },
    { drug_code: "288", generic_name: "Losartan Tablets IP 25mg", mrp: 7.22, category: "Cardiovascular System (CVS)", primary_ingredient: "Losartan", strength: "25mg", formulation: "Tablets" },
    { drug_code: "300", generic_name: "Telmisartan Tablets IP 40mg", mrp: 11.25, category: "Cardiovascular System (CVS)", primary_ingredient: "Telmisartan", strength: "40mg", formulation: "Tablets" },
    { drug_code: "240", generic_name: "Cetrizine Hydrochloride Tablets IP 10mg", mrp: 5.16, category: "Anti-Histaminic", primary_ingredient: "Cetirizine", strength: "10mg", formulation: "Tablets" },
    { drug_code: "398", generic_name: "Paracetamol Tablets IP 650 mg", mrp: 14.07, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Paracetamol", strength: "650mg", formulation: "Tablets" },
    { drug_code: "85", generic_name: "Ciprofloxacin Hydrochloride Tablets IP 500 mg", mrp: 18.75, category: "Antibiotics", primary_ingredient: "Ciprofloxacin", strength: "500mg", formulation: "Tablets" },
    { drug_code: "96", generic_name: "Levofloxacin Tablets IP 500mg", mrp: 30.94, category: "Antibiotics", primary_ingredient: "Levofloxacin", strength: "500mg", formulation: "Tablets" },
    { drug_code: "279", generic_name: "Frusemide Tablets IP 40 mg", mrp: 4.69, category: "Diuretic", primary_ingredient: "Furosemide", strength: "40mg", formulation: "Tablets" },
    { drug_code: "14", generic_name: "Ibuprofen 400mg and Paracetamol 325mg Tablets IP", mrp: 7.5, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Ibuprofen", strength: "400mg", formulation: "Tablets" },
    { drug_code: "15", generic_name: "Ibuprofen Tablets IP 200 mg", mrp: 2.82, category: "Analgesic/Antipyretic/Anti-Inflammatory", primary_ingredient: "Ibuprofen", strength: "200mg", formulation: "Tablets" },
    { drug_code: "137", generic_name: "Glimepiride Tablets IP 1mg", mrp: 4.13, category: "Anti-Diabetic", primary_ingredient: "Glimepiride", strength: "1mg", formulation: "Tablets" },
    { drug_code: "138", generic_name: "Glimepiride Tablets IP 2mg", mrp: 5.16, category: "Anti-Diabetic", primary_ingredient: "Glimepiride", strength: "2mg", formulation: "Tablets" },
    { drug_code: "256", generic_name: "Salbutamol Tablets IP 2mg", mrp: 0.94, category: "Respiratory", primary_ingredient: "Salbutamol", strength: "2mg", formulation: "Tablets" },
    { drug_code: "29", generic_name: "Aciclovir Tablets IP 400 mg", mrp: 41.25, category: "Anti-Viral", primary_ingredient: "Acyclovir", strength: "400mg", formulation: "Tablets" }
];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Insert data in batches
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < JANAUSHADHI_DATA.length; i += batchSize) {
            const batch = JANAUSHADHI_DATA.slice(i, i + batchSize);

            const { error } = await supabase
                .from('janaushadhi_medicines')
                .upsert(batch, { onConflict: 'drug_code' });

            if (error) {
                console.error('Insert error:', error);
            } else {
                inserted += batch.length;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Imported ${inserted} Janaushadhi medicines`,
                total: JANAUSHADHI_DATA.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
