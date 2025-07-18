DROP TRIGGER IF EXISTS trg_validate_account_org_env ON accounts;
DROP FUNCTION IF EXISTS validate_account_organization_version_env;
-- Fonction qui vérifie que l'environnement de l'account correspond à celui de l'organization_version

CREATE OR REPLACE FUNCTION validate_account_organization_version_env()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_version_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM organization_versions
    WHERE id = NEW.organization_version_id
      AND environment = NEW.environment
  ) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Account.environment (%) must match OrganizationVersion.environment (%) for orgVersionId %',
      NEW.environment,
      (SELECT environment FROM organization_versions WHERE id = NEW.organization_version_id),
      NEW.organization_version_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger avant INSERT/UPDATE
CREATE TRIGGER trg_validate_account_org_env
BEFORE INSERT OR UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION validate_account_organization_version_env();
