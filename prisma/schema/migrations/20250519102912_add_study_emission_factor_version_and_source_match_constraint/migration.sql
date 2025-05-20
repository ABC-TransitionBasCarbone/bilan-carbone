DROP TRIGGER  IF EXISTS trg_check_matching_source ON study_emission_factor_versions;
DROP FUNCTION IF EXISTS check_matching_source();

CREATE FUNCTION check_matching_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  real_source text;
BEGIN
  SELECT source::text
  INTO   real_source
  FROM   emission_factor_import_version
  WHERE  id = NEW.import_version_id;

  /* Si aucune version trouvée, la clé étrangère échouera d’elle-même.     */
  IF real_source IS NOT NULL AND real_source = NEW.source::text THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Mismatch: import_version_id % a la source %, alors que NEW.source = %',
    NEW.import_version_id, real_source, NEW.source;
END;
$$;

CREATE TRIGGER trg_check_matching_source
BEFORE INSERT OR UPDATE
ON study_emission_factor_versions
FOR EACH ROW
EXECUTE FUNCTION check_matching_source();
