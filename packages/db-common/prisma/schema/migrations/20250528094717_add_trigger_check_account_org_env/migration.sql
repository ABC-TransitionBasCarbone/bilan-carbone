DROP TRIGGER IF EXISTS trg_validate_account_org_env ON bilan_carbone.accounts;
DROP FUNCTION IF EXISTS bilan_carbone.validate_account_organization_version_env;
-- Fonction qui vérifie que l'environnement de l'account correspond à celui de l'organization_version

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

-- Trigger avant INSERT/UPDATE
CREATE TRIGGER trg_validate_account_org_env
BEFORE INSERT OR UPDATE ON bilan_carbone.accounts
FOR EACH ROW
EXECUTE FUNCTION bilan_carbone.validate_account_organization_version_env();
