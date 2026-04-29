DROP TRIGGER  IF EXISTS trg_validate_emission_source_emission_factor_version ON study_emission_sources;
DROP FUNCTION IF EXISTS validate_emission_source_emission_factor_version();

CREATE OR REPLACE FUNCTION validate_emission_source_emission_factor_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ef_version_id UUID;
  ef_source     TEXT;
BEGIN
  IF NEW.emission_factor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT version_id, imported_from
  INTO   ef_version_id, ef_source
  FROM   emission_factors
  WHERE  id = NEW.emission_factor_id;

  IF ef_source = 'Manual' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
        SELECT 1
        FROM emission_factors               ef
        JOIN study_emission_factor_versions sefv
          ON sefv.import_version_id = ef.version_id
        WHERE ef.id       = NEW.emission_factor_id 
          AND sefv.study_id = NEW.study_id
     )
  THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION
      'emission_factor_id % (version %) non autorisé pour study_id %',
      NEW.emission_factor_id,
      (SELECT version_id FROM emission_factors WHERE id = NEW.emission_factor_id),
      NEW.study_id;
  END IF;
END;
$$;

CREATE TRIGGER trg_validate_emission_source_emission_factor_version
BEFORE INSERT OR UPDATE
ON study_emission_sources
FOR EACH ROW
EXECUTE FUNCTION validate_emission_source_emission_factor_version();
