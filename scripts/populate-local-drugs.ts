/**
 * Script to populate local_drugs table from src/data files
 * Run with: npm run populate-drugs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { loadAllDrugs } from '../src/data/drugDataLoader';

// Load environment variables from .env file
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function populateLocalDrugs() {
  console.log('🚀 Starting local drugs population...\n');
  
  try {
    // Load all drugs from local data files
    console.log('📚 Loading all drugs from src/data...');
    const allDrugs = await loadAllDrugs();
    console.log(`✅ Loaded ${allDrugs.length} drugs\n`);
    
    // Transform data for database with DEDUPLICATION
    console.log('🔄 Transforming and deduplicating data...');
    
    // Deduplication logic: group by normalized name and keep best data
    const drugMap = new Map<string, typeof allDrugs[0]>();
    let duplicatesFound = 0;
    
    for (const drug of allDrugs) {
      const normalizedKey = drug.name.toLowerCase().trim();
      
      if (drugMap.has(normalizedKey)) {
        duplicatesFound++;
        const existing = drugMap.get(normalizedKey)!;
        
        // Merge: keep the one with more complete data
        const existingScore = [
          existing.description,
          existing.dosageAndAdmin,
          existing.mechanism,
          existing.indications?.length,
          existing.sideEffects?.length
        ].filter(Boolean).length;
        
        const newScore = [
          drug.description,
          drug.dosageAndAdmin,
          drug.mechanism,
          drug.indications?.length,
          drug.sideEffects?.length
        ].filter(Boolean).length;
        
        if (newScore > existingScore) {
          console.log(`   Replacing "${existing.name}" with more complete version`);
          drugMap.set(normalizedKey, drug);
        }
      } else {
        drugMap.set(normalizedKey, drug);
      }
    }
    
    const uniqueDrugs = Array.from(drugMap.values());
    console.log(`✅ Found ${duplicatesFound} duplicates, keeping ${uniqueDrugs.length} unique drugs\n`);
    
    const dbRecords = uniqueDrugs.map(drug => ({
      id: drug.id,
      name: drug.name,
      name_normalized: drug.name.toLowerCase().trim(),
      generic_name: drug.genericName || null,
      generic_normalized: drug.genericName?.toLowerCase().trim() || null,
      brand_names: drug.brandNames || [],
      manufacturer: drug.manufacturer || null,
      category: drug.category || null,
      drug_class: drug.drugClass || null,
      description: drug.description || null,
      dosage_and_admin: drug.dosageAndAdmin || null,
      mechanism: drug.mechanism || null,
      indications: drug.indications || [],
      contraindications: drug.contraindications || [],
      warnings: drug.warnings || [],
      side_effects: drug.sideEffects || [],
      interactions: drug.interactions || [],
      pregnancy: drug.pregnancy || null,
      storage: drug.storage || null,
      prescription_status: drug.prescriptionStatus || null,
      verified: drug.verified !== undefined ? drug.verified : true,
      layman_explanations: drug.laymanExplanations || null
    }));
    
    console.log(`✅ Transformed ${dbRecords.length} unique records\n`);
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('local_drugs')
      .delete()
      .neq('id', ''); // Delete all
    
    if (deleteError) {
      console.warn('⚠️  Warning clearing data:', deleteError.message);
    } else {
      console.log('✅ Cleared existing data\n');
    }
    
    // Insert in batches of 100
    const batchSize = 100;
    const totalBatches = Math.ceil(dbRecords.length / batchSize);
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`📦 Inserting ${totalBatches} batches...\n`);
    
    for (let i = 0; i < dbRecords.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      const batch = dbRecords.slice(i, i + batchSize);
      
      process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} drugs)...`);
      
      const { data, error } = await supabase
        .from('local_drugs')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(` ❌ Error`);
        console.error(`   ${error.message}\n`);
        errorCount += batch.length;
      } else {
        console.log(` ✅`);
        successCount += batch.length;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Population Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully inserted: ${successCount} drugs`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} drugs`);
    }
    console.log('='.repeat(50));
    
    // Verify the data
    console.log('\n🔍 Verifying data...');
    const { count, error: countError } = await supabase
      .from('local_drugs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error verifying:', countError.message);
    } else {
      console.log(`✅ Total drugs in database: ${count}`);
    }
    
    // Test the search function
    console.log('\n🧪 Testing search function...');
    const testQueries = ['Paracetamol', 'Tylenol', 'Aspirin'];
    
    for (const query of testQueries) {
      const { data: results, error: searchError } = await supabase
        .rpc('search_local_drugs', { 
          search_query: query,
          similarity_threshold: 0.6
        });
      
      if (searchError) {
        console.error(`   ❌ Error searching "${query}":`, searchError.message);
      } else {
        const matchCount = results?.length || 0;
        console.log(`   ✅ "${query}": Found ${matchCount} matches`);
        if (matchCount > 0 && results?.[0]) {
          const topMatch = results[0];
          console.log(`      Top: ${topMatch.drug_data.name} (score: ${topMatch.match_score.toFixed(2)}, type: ${topMatch.match_type})`);
        }
      }
    }
    
    console.log('\n🎉 Population complete!');
    console.log('💡 You can now use the local drug search in your identification system.\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the population
populateLocalDrugs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
