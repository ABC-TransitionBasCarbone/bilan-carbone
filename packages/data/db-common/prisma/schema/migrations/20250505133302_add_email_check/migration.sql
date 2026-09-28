-- Fonction qui force la minuscule
CREATE OR REPLACE FUNCTION enforce_email_lowercase()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email) THEN
    NEW.email := lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger avant INSERT/UPDATE
CREATE TRIGGER lowercase_email_trigger
BEFORE INSERT OR UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION enforce_email_lowercase();