-- AlterTable
ALTER TABLE "actualities" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "deactivable_features_statuses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factor_parts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factors" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "licenses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sites" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "studies" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_emission_sources" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;
