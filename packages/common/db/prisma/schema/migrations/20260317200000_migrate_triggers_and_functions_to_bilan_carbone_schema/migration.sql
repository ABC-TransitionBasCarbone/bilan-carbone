-- After migrating tables to bilan_carbone schema, triggers moved with their tables
-- but the functions they reference still live in public. This migration drops the
-- stale public functions and recreates everything in bilan_carbone.

-- Drop old triggers (they were carried to bilan_carbone tables when tables moved schema)
DROP TRIGGER IF EXISTS lowercase_email_trigger ON bilan_carbone."users";
DROP TRIGGER IF EXISTS trg_validate_study_site ON bilan_carbone.study_emission_sources;
DROP TRIGGER IF EXISTS trg_check_matching_source ON bilan_carbone.study_emission_factor_versions;
DROP TRIGGER IF EXISTS trg_validate_account_org_env ON bilan_carbone.accounts;

-- Drop old public functions
DROP FUNCTION IF EXISTS public.enforce_email_lowercase();
DROP FUNCTION IF EXISTS public.validate_study_site_id();
DROP FUNCTION IF EXISTS public.check_matching_source();
DROP FUNCTION IF EXISTS public.validate_account_organization_version_env();

-- Recreate enforce_email_lowercase in bilan_carbone
CREATE OR REPLACE FUNCTION bilan_carbone.enforce_email_lowercase()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email) THEN
    NEW.email := lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lowercase_email_trigger
BEFORE INSERT OR UPDATE ON bilan_carbone."users"
FOR EACH ROW
EXECUTE FUNCTION bilan_carbone.enforce_email_lowercase();

-- Recreate validate_study_site_id in bilan_carbone
CREATE OR REPLACE FUNCTION bilan_carbone.validate_study_site_id()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bilan_carbone.study_sites
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
BEFORE INSERT OR UPDATE ON bilan_carbone.study_emission_sources
FOR EACH ROW
EXECUTE FUNCTION bilan_carbone.validate_study_site_id();

-- Recreate check_matching_source in bilan_carbone
CREATE OR REPLACE FUNCTION bilan_carbone.check_matching_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  real_source text;
BEGIN
  SELECT source::text
  INTO   real_source
  FROM   bilan_carbone.emission_factor_import_version
  WHERE  id = NEW.import_version_id;

  /* Si aucune version trouvée, la clé étrangère échouera d'elle-même.     */
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
ON bilan_carbone.study_emission_factor_versions
FOR EACH ROW
EXECUTE FUNCTION bilan_carbone.check_matching_source();

-- Recreate validate_account_organization_version_env in bilan_carbone
CREATE OR REPLACE FUNCTION bilan_carbone.validate_account_organization_version_env()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_version_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bilan_carbone.organization_versions
    WHERE id = NEW.organization_version_id
      AND environment = NEW.environment
  ) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Account.environment (%) must match OrganizationVersion.environment (%) for orgVersionId %',
      NEW.environment,
      (SELECT environment FROM bilan_carbone.organization_versions WHERE id = NEW.organization_version_id),
      NEW.organization_version_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_account_org_env
BEFORE INSERT OR UPDATE ON bilan_carbone.accounts
FOR EACH ROW
EXECUTE FUNCTION bilan_carbone.validate_account_organization_version_env();
