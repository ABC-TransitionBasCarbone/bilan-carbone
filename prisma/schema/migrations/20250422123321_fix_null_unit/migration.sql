-- This is an empty migration.
UPDATE emission_factors SET unit = 'KG' WHERE unit IS NULL;
