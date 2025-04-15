UPDATE "licenses" SET "rights" = array_replace("rights", 'DEFAULT', 'COLLABORATOR') WHERE 'DEFAULT' = ANY("rights");
UPDATE "users" SET "role" = 'COLLABORATOR' WHERE "role" = 'DEFAULT' AND "level" IS NOT NULL;
