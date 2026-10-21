-- Legifrance
UPDATE emission_factor_import_version SET name = '2023' WHERE source = 'Legifrance' AND name <> 'test';

-- NegaOctet
UPDATE emission_factor_import_version SET name = '1.0' WHERE source = 'NegaOctet' AND name <> 'test';
