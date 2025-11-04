-- Create drug identification cache table
CREATE TABLE IF NOT EXISTS drug_identification_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Drug identification keys
    drug_name TEXT NOT NULL,
    generic_name TEXT,
    imprint TEXT,
    color TEXT,
    shape TEXT,
    
    -- Cached drug information
    manufacturer TEXT,
    category TEXT,
    drug_class TEXT,
    description TEXT,
    dosage_and_admin TEXT,
    side_effects JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    interactions JSONB DEFAULT '[]'::jsonb,
    storage TEXT,
    mechanism TEXT,
    indications JSONB DEFAULT '[]'::jsonb,
    contraindications JSONB DEFAULT '[]'::jsonb,
    prescription_status TEXT,
    pregnancy TEXT,
    brand_names JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    sources_used JSONB DEFAULT '[]'::jsonb, -- Array of API sources that provided data
    completeness_score INTEGER DEFAULT 0, -- 0-100 score of data completeness
    verified BOOLEAN DEFAULT FALSE,
    confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
    
    -- Search optimization
    search_vector tsvector,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    UNIQUE(drug_name, generic_name)
);

-- Create indexes for fast lookups
CREATE INDEX idx_drug_cache_name ON drug_identification_cache(LOWER(drug_name));
CREATE INDEX idx_drug_cache_generic ON drug_identification_cache(LOWER(generic_name));
CREATE INDEX idx_drug_cache_imprint ON drug_identification_cache(LOWER(imprint)) WHERE imprint IS NOT NULL;
CREATE INDEX idx_drug_cache_search ON drug_identification_cache USING gin(search_vector);
CREATE INDEX idx_drug_cache_accessed ON drug_identification_cache(last_accessed_at DESC);

-- Create search vector trigger
CREATE OR REPLACE FUNCTION update_drug_cache_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.drug_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.generic_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.imprint, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.manufacturer, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_drug_cache_search_vector
    BEFORE INSERT OR UPDATE ON drug_identification_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_drug_cache_search_vector();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_drug_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_drug_cache_timestamp
    BEFORE UPDATE ON drug_identification_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_drug_cache_timestamp();

-- Add RLS policies
ALTER TABLE drug_identification_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to drug cache"
    ON drug_identification_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read cache
CREATE POLICY "Authenticated users can read drug cache"
    ON drug_identification_cache
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anonymous users to read cache (for public drug lookups)
CREATE POLICY "Anonymous users can read drug cache"
    ON drug_identification_cache
    FOR SELECT
    TO anon
    USING (true);

-- Create function to get cached drug by name
CREATE OR REPLACE FUNCTION get_cached_drug(
    p_drug_name TEXT,
    p_generic_name TEXT DEFAULT NULL,
    p_imprint TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    drug_name TEXT,
    generic_name TEXT,
    manufacturer TEXT,
    category TEXT,
    drug_class TEXT,
    description TEXT,
    dosage_and_admin TEXT,
    side_effects JSONB,
    warnings JSONB,
    interactions JSONB,
    storage TEXT,
    mechanism TEXT,
    indications JSONB,
    contraindications JSONB,
    prescription_status TEXT,
    pregnancy TEXT,
    brand_names JSONB,
    sources_used JSONB,
    completeness_score INTEGER,
    verified BOOLEAN,
    confidence TEXT,
    imprint TEXT,
    color TEXT,
    shape TEXT
) AS $$
BEGIN
    -- Update access tracking
    UPDATE drug_identification_cache
    SET 
        last_accessed_at = NOW(),
        access_count = access_count + 1
    WHERE 
        LOWER(drug_identification_cache.drug_name) = LOWER(p_drug_name)
        OR (p_generic_name IS NOT NULL AND LOWER(drug_identification_cache.generic_name) = LOWER(p_generic_name))
        OR (p_imprint IS NOT NULL AND LOWER(drug_identification_cache.imprint) = LOWER(p_imprint));
    
    -- Return matching drug
    RETURN QUERY
    SELECT 
        dic.id,
        dic.drug_name,
        dic.generic_name,
        dic.manufacturer,
        dic.category,
        dic.drug_class,
        dic.description,
        dic.dosage_and_admin,
        dic.side_effects,
        dic.warnings,
        dic.interactions,
        dic.storage,
        dic.mechanism,
        dic.indications,
        dic.contraindications,
        dic.prescription_status,
        dic.pregnancy,
        dic.brand_names,
        dic.sources_used,
        dic.completeness_score,
        dic.verified,
        dic.confidence,
        dic.imprint,
        dic.color,
        dic.shape
    FROM drug_identification_cache dic
    WHERE 
        LOWER(dic.drug_name) = LOWER(p_drug_name)
        OR (p_generic_name IS NOT NULL AND LOWER(dic.generic_name) = LOWER(p_generic_name))
        OR (p_imprint IS NOT NULL AND LOWER(dic.imprint) = LOWER(p_imprint))
    ORDER BY completeness_score DESC, access_count DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to save drug to cache
CREATE OR REPLACE FUNCTION save_drug_to_cache(
    p_drug_name TEXT,
    p_drug_data JSONB
)
RETURNS UUID AS $$
DECLARE
    v_drug_id UUID;
BEGIN
    INSERT INTO drug_identification_cache (
        drug_name,
        generic_name,
        manufacturer,
        category,
        drug_class,
        description,
        dosage_and_admin,
        side_effects,
        warnings,
        interactions,
        storage,
        mechanism,
        indications,
        contraindications,
        prescription_status,
        pregnancy,
        brand_names,
        imprint,
        color,
        shape,
        sources_used,
        completeness_score,
        verified,
        confidence
    ) VALUES (
        p_drug_name,
        p_drug_data->>'genericName',
        p_drug_data->>'manufacturer',
        p_drug_data->>'category',
        p_drug_data->>'drugClass',
        p_drug_data->>'description',
        p_drug_data->>'dosageAndAdmin',
        COALESCE(p_drug_data->'sideEffects', '[]'::jsonb),
        COALESCE(p_drug_data->'warnings', '[]'::jsonb),
        COALESCE(p_drug_data->'interactions', '[]'::jsonb),
        p_drug_data->>'storage',
        p_drug_data->>'mechanism',
        COALESCE(p_drug_data->'indications', '[]'::jsonb),
        COALESCE(p_drug_data->'contraindications', '[]'::jsonb),
        p_drug_data->>'prescriptionStatus',
        p_drug_data->>'pregnancy',
        COALESCE(p_drug_data->'brandNames', '[]'::jsonb),
        p_drug_data->>'imprint',
        p_drug_data->>'color',
        p_drug_data->>'shape',
        COALESCE(p_drug_data->'sourcesUsed', '[]'::jsonb),
        COALESCE((p_drug_data->>'completeness')::INTEGER, 0),
        COALESCE((p_drug_data->>'verified')::BOOLEAN, FALSE),
        COALESCE(p_drug_data->>'confidence', 'medium')
    )
    ON CONFLICT (drug_name, generic_name) 
    DO UPDATE SET
        manufacturer = EXCLUDED.manufacturer,
        category = EXCLUDED.category,
        drug_class = EXCLUDED.drug_class,
        description = EXCLUDED.description,
        dosage_and_admin = EXCLUDED.dosage_and_admin,
        side_effects = EXCLUDED.side_effects,
        warnings = EXCLUDED.warnings,
        interactions = EXCLUDED.interactions,
        storage = EXCLUDED.storage,
        mechanism = EXCLUDED.mechanism,
        indications = EXCLUDED.indications,
        contraindications = EXCLUDED.contraindications,
        prescription_status = EXCLUDED.prescription_status,
        pregnancy = EXCLUDED.pregnancy,
        brand_names = EXCLUDED.brand_names,
        imprint = EXCLUDED.imprint,
        color = EXCLUDED.color,
        shape = EXCLUDED.shape,
        sources_used = EXCLUDED.sources_used,
        completeness_score = EXCLUDED.completeness_score,
        verified = EXCLUDED.verified,
        confidence = EXCLUDED.confidence,
        updated_at = NOW()
    RETURNING id INTO v_drug_id;
    
    RETURN v_drug_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE drug_identification_cache IS 'Cache table for storing successfully identified drug information to reduce API calls and improve response time';
COMMENT ON FUNCTION get_cached_drug IS 'Retrieves cached drug information by name, generic name, or imprint, and updates access tracking';
COMMENT ON FUNCTION save_drug_to_cache IS 'Saves or updates drug information in cache, handling conflicts by updating existing records';
