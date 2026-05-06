ALTER TABLE "bilan_carbone"."emission_factor_parts"
  ADD COLUMN "imported_raw_csv" TEXT,
  ADD COLUMN "override_raw_csv" TEXT;
