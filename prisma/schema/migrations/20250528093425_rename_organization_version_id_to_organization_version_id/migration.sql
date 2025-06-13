
-- Changements manuels pour renommer la colonne `organizationVersion_id` en `organization_version_id`

-- Renommer la colonne dans la table `accounts`
ALTER TABLE "accounts" RENAME COLUMN "organizationVersion_id" TO "organization_version_id";

-- Renommer la colonne dans la table `studies`
ALTER TABLE "studies" RENAME COLUMN "organizationVersion_id" TO "organization_version_id";

-- Supprimer les anciennes contraintes si elles existent
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_organizationVersion_id_fkey";
ALTER TABLE "studies" DROP CONSTRAINT IF EXISTS "studies_organizationVersion_id_fkey";
DROP INDEX IF EXISTS "accounts_user_id_organizationVersion_id_key";

-- Ajouter à nouveau les contraintes avec les nouveaux noms
CREATE UNIQUE INDEX "accounts_user_id_organization_version_id_key" ON "accounts"("user_id", "organization_version_id");

ALTER TABLE "studies"
ADD CONSTRAINT "studies_organization_version_id_fkey"
FOREIGN KEY ("organization_version_id") REFERENCES "organization_versions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_organization_version_id_fkey"
FOREIGN KEY ("organization_version_id") REFERENCES "organization_versions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;


