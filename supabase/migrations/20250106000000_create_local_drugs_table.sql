-- Create local_drugs table for fast drug identification
-- This table stores all drugs from src/data for instant lookup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text matching

-- Create the main table
CREATE TABLE IF NOT EXISTS local_drugs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  generic_name TEXT,
  generic_normalized TEXT,
  brand_names TEXT[],
  manufacturer TEXT,
  category TEXT,
  drug_class TEXT,
  description TEXT,
  dosage_and_admin TEXT,
  mechanism TEXT,
  indications JSONB DEFAULT '[]'::jsonb,
  contraindications JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  side_effects JSONB DEFAULT '[]'::jsonb,
  interactions JSONB DEFAULT '[]'::jsonb,
  pregnancy TEXT,
  storage TEXT,
  prescription_status TEXT,
  verified BOOLEAN DEFAULT true,
  layman_explanations JSONB,
  -- Full-text search vector (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(name, '') || ' ' ||
      coalesce(generic_name, '') || ' ' ||
      coalesce(array_to_string(brand_names, ' '), '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_local_drugs_name ON local_drugs(name_normalized);
CREATE INDEX IF NOT EXISTS idx_local_drugs_generic ON local_drugs(generic_normalized);
CREATE INDEX IF NOT EXISTS idx_local_drugs_search_vector ON local_drugs USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_local_drugs_category ON local_drugs(category);
CREATE INDEX IF NOT EXISTS idx_local_drugs_drug_class ON local_drugs(drug_class);

-- Create similarity indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_local_drugs_name_trgm ON local_drugs USING gin(name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_local_drugs_generic_trgm ON local_drugs USING gin(generic_normalized gin_trgm_ops);

-- Function to search local drugs with multiple matching strategies
CREATE OR REPLACE FUNCTION search_local_drugs(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  drug_data JSONB,
  match_score FLOAT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH exact_matches AS (
    -- Exact name matches (highest priority)
    SELECT 
      jsonb_build_object(
        'id', ld.id,
        'name', ld.name,
        'genericName', ld.generic_name,
        'brandNames', ld.brand_names,
        'manufacturer', ld.manufacturer,
        'category', ld.category,
        'drugClass', ld.drug_class,
        'description', ld.description,
        'dosageAndAdmin', ld.dosage_and_admin,
        'mechanism', ld.mechanism,
        'indications', ld.indications,
        'contraindications', ld.contraindications,
        'warnings', ld.warnings,
        'sideEffects', ld.side_effects,
        'interactions', ld.interactions,
        'pregnancy', ld.pregnancy,
        'storage', ld.storage,
        'prescriptionStatus', ld.prescription_status,
        'verified', ld.verified,
        'laymanExplanations', ld.layman_explanations
      ) as drug_data,
      1.0::float as score,
      'exact'::text as type
    FROM local_drugs ld
    WHERE 
      lower(ld.name) = lower(search_query) OR
      lower(ld.generic_name) = lower(search_query) OR
      lower(search_query) = ANY(SELECT lower(unnest(ld.brand_names)))
  ),
  fuzzy_matches AS (
    -- Fuzzy similarity matches
    SELECT 
      jsonb_build_object(
        'id', ld.id,
        'name', ld.name,
        'genericName', ld.generic_name,
        'brandNames', ld.brand_names,
        'manufacturer', ld.manufacturer,
        'category', ld.category,
        'drugClass', ld.drug_class,
        'description', ld.description,
        'dosageAndAdmin', ld.dosage_and_admin,
        'mechanism', ld.mechanism,
        'indications', ld.indications,
        'contraindications', ld.contraindications,
        'warnings', ld.warnings,
        'sideEffects', ld.side_effects,
        'interactions', ld.interactions,
        'pregnancy', ld.pregnancy,
        'storage', ld.storage,
        'prescriptionStatus', ld.prescription_status,
        'verified', ld.verified,
        'laymanExplanations', ld.layman_explanations
      ) as drug_data,
      GREATEST(
        similarity(ld.name_normalized, lower(search_query)),
        COALESCE(similarity(ld.generic_normalized, lower(search_query)), 0),
        COALESCE((SELECT MAX(similarity(lower(brand), lower(search_query))) 
         FROM unnest(ld.brand_names) AS brand), 0)
      ) as score,
      'fuzzy'::text as type
    FROM local_drugs ld
    WHERE 
      similarity(ld.name_normalized, lower(search_query)) > similarity_threshold OR
      COALESCE(similarity(ld.generic_normalized, lower(search_query)), 0) > similarity_threshold OR
      EXISTS (
        SELECT 1 FROM unnest(ld.brand_names) AS brand 
        WHERE similarity(lower(brand), lower(search_query)) > similarity_threshold
      )
  ),
  fulltext_matches AS (
    -- Full-text search matches
    SELECT 
      jsonb_build_object(
        'id', ld.id,
        'name', ld.name,
        'genericName', ld.generic_name,
        'brandNames', ld.brand_names,
        'manufacturer', ld.manufacturer,
        'category', ld.category,
        'drugClass', ld.drug_class,
        'description', ld.description,
        'dosageAndAdmin', ld.dosage_and_admin,
        'mechanism', ld.mechanism,
        'indications', ld.indications,
        'contraindications', ld.contraindications,
        'warnings', ld.warnings,
        'sideEffects', ld.side_effects,
        'interactions', ld.interactions,
        'pregnancy', ld.pregnancy,
        'storage', ld.storage,
        'prescriptionStatus', ld.prescription_status,
        'verified', ld.verified,
        'laymanExplanations', ld.layman_explanations
      ) as drug_data,
      ts_rank(ld.search_vector, plainto_tsquery('english', search_query)) * 0.7 as score,
      'fulltext'::text as type
    FROM local_drugs ld
    WHERE ld.search_vector @@ plainto_tsquery('english', search_query)
  )
  -- Combine all results, prioritizing exact matches
  SELECT * FROM exact_matches
  UNION ALL
  SELECT * FROM fuzzy_matches
  WHERE NOT EXISTS (SELECT 1 FROM exact_matches)
  UNION ALL
  SELECT * FROM fulltext_matches
  WHERE NOT EXISTS (SELECT 1 FROM exact_matches)
    AND NOT EXISTS (SELECT 1 FROM fuzzy_matches)
  ORDER BY score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON local_drugs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_local_drugs TO anon, authenticated;

-- Add comment
COMMENT ON TABLE local_drugs IS 'Local drug database for fast identification without external API calls';
COMMENT ON FUNCTION search_local_drugs IS 'Searches drugs using exact, fuzzy, and full-text matching strategies';
