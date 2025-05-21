DROP TRIGGER  IF EXISTS trg_validate_study_site ON study_emission_sources;
DROP FUNCTION IF EXISTS validate_study_site_id();

CREATE OR REPLACE FUNCTION validate_study_site_id()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM study_sites
    WHERE id = NEW.study_site_id
      AND study_id = NEW.study_id
  ) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'study_site_id % does not belong to study_id %', NEW.study_site_id, NEW.study_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_study_site
BEFORE INSERT OR UPDATE ON study_emission_sources
FOR EACH ROW
EXECUTE FUNCTION validate_study_site_id();
