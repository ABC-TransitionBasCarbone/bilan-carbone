-- Update emission factors and study_emission_factor_versions
UPDATE emission_factors 
SET version_id = (SELECT id from emission_factor_import_version WHERE intern_id like '%reseau%cha%' LIMIT 1) 
WHERE version_id = (SELECT id from emission_factor_import_version WHERE intern_id like '%froid%' LIMIT 1);

UPDATE study_emission_factor_versions 
SET import_version_id = (SELECT id from emission_factor_import_version WHERE intern_id like '%reseau%cha%' LIMIT 1) 
WHERE import_version_id = (SELECT id from emission_factor_import_version WHERE intern_id like '%froid%' LIMIT 1);

-- Delete unused emission_factor_import_version
DELETE FROM emission_factor_import_version WHERE intern_id like '%froid%';

-- fix wrong import source
UPDATE emission_factor_import_version SET source = 'Legifrance' WHERE intern_id like '%reseau%cha%';