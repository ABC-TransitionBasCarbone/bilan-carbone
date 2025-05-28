-- Fonction qui vérifie que l'environnement de l'account correspond à celui de l'organization_version
CREATE OR REPLACE FUNCTION check_account_organization_version_environment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_version_id IS NOT NULL THEN
    PERFORM 1
    FROM organization_versions ov
    WHERE ov.id = NEW.organization_version_id
      AND ov.environment = NEW.environment;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account Environment is different from Organization Environment';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger avant INSERT/UPDATE
CREATE TRIGGER check_same_environment_account_organization_version
BEFORE INSERT OR UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION check_account_organization_version_environment();