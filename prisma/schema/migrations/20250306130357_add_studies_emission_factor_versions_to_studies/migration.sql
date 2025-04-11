CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO "study_emission_factor_versions" ("id", "study_id", "source", "import_version_id")
SELECT 
    uuid_generate_v4(),
    s.id, 
    'BaseEmpreinte'::"Import", 
    (SELECT id FROM "emission_factor_import_version" WHERE source = 'BaseEmpreinte' ORDER BY "created_at" DESC LIMIT 1)
FROM "studies" s
UNION ALL
SELECT 
    uuid_generate_v4(),
    s.id, 
    'Legifrance'::"Import", 
    (SELECT id FROM "emission_factor_import_version" WHERE source = 'Legifrance' ORDER BY "created_at" DESC LIMIT 1)
FROM "studies" s
UNION ALL
SELECT 
    uuid_generate_v4(),
    s.id, 
    'NegaOctet'::"Import", 
    (SELECT id FROM "emission_factor_import_version" WHERE source = 'NegaOctet' ORDER BY "created_at" DESC LIMIT 1)
FROM "studies" s;