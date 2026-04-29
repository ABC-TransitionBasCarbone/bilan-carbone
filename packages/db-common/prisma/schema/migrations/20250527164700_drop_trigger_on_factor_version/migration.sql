-- This migration drops the trigger and function that validate the emission factor version. TO PUT BACK AFTER ALL MIGRATIONS ARE DONE

DROP TRIGGER  IF EXISTS trg_validate_emission_source_emission_factor_version ON bilan_carbone.study_emission_sources;
DROP FUNCTION IF EXISTS bilan_carbone.validate_emission_source_emission_factor_version();
