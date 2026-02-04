DROP FUNCTION IF EXISTS public.find_janaushadhi_match(text, text);

CREATE OR REPLACE FUNCTION public.find_janaushadhi_match(
  p_generic_name text,
  p_ingredient text DEFAULT NULL::text
)
RETURNS TABLE(
  drug_code character varying,
  generic_name text,
  mrp numeric,
  category character varying,
  strength character varying,
  formulation character varying,
  match_type text,
  similarity_score real
)
LANGUAGE plpgsql
AS $function$
DECLARE
  normalized_name text := lower(trim(coalesce(p_generic_name, '')));
  normalized_ing text := lower(trim(coalesce(p_ingredient, '')));
  is_combo_query boolean := false;
BEGIN
  is_combo_query := normalized_name ~ '\\b(and|\\+|with|/|,)\\b';

  IF normalized_name <> '' THEN
    RETURN QUERY
    SELECT
      jm.drug_code,
      jm.generic_name,
      jm.mrp,
      jm.category,
      jm.strength,
      jm.formulation,
      'exact'::text AS match_type,
      1.0::real AS similarity_score
    FROM janaushadhi_medicines jm
    WHERE jm.generic_name_lower = normalized_name
    ORDER BY
      CASE WHEN jm.mrp IS NULL OR jm.mrp <= 0 THEN 1 ELSE 0 END ASC,
      jm.mrp ASC
    LIMIT 3;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  IF normalized_ing <> '' THEN
    RETURN QUERY
    SELECT
      jm.drug_code,
      jm.generic_name,
      jm.mrp,
      jm.category,
      jm.strength,
      jm.formulation,
      'ingredient'::text AS match_type,
      1.0::real AS similarity_score
    FROM janaushadhi_medicines jm
    WHERE
      lower(coalesce(jm.primary_ingredient, '')) = normalized_ing
      OR jm.generic_name_lower LIKE '%' || normalized_ing || '%'
    ORDER BY
      CASE WHEN jm.mrp IS NULL OR jm.mrp <= 0 THEN 1 ELSE 0 END ASC,
      CASE WHEN lower(coalesce(jm.primary_ingredient, '')) = normalized_ing THEN 0 ELSE 1 END ASC,
      CASE
        WHEN is_combo_query THEN 0
        WHEN jm.generic_name_lower ~ '\\band\\b' THEN 1
        ELSE 0
      END ASC,
      CASE
        WHEN normalized_name <> '' AND jm.generic_name_lower LIKE '%' || normalized_name || '%' THEN 0
        ELSE 1
      END ASC,
      jm.mrp ASC
    LIMIT 3;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  IF normalized_name <> '' THEN
    RETURN QUERY
    SELECT
      jm.drug_code,
      jm.generic_name,
      jm.mrp,
      jm.category,
      jm.strength,
      jm.formulation,
      'fulltext'::text AS match_type,
      ts_rank(
        to_tsvector('english', coalesce(jm.generic_name, '')),
        plainto_tsquery('english', normalized_name)
      )::real AS similarity_score
    FROM janaushadhi_medicines jm
    WHERE
      to_tsvector('english', coalesce(jm.generic_name, '')) @@ plainto_tsquery('english', normalized_name)
    ORDER BY
      CASE WHEN jm.mrp IS NULL OR jm.mrp <= 0 THEN 1 ELSE 0 END ASC,
      CASE
        WHEN is_combo_query THEN 0
        WHEN jm.generic_name_lower ~ '\\band\\b' THEN 1
        ELSE 0
      END ASC,
      similarity_score DESC,
      jm.mrp ASC
    LIMIT 3;
  END IF;
END;
$function$;
