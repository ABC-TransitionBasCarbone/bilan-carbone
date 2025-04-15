-- CreateEnum
CREATE TYPE "DeactivatableFeature" AS ENUM ('Formation');

-- CreateTable
CREATE TABLE "deactivable_features_statuses" (
    "id" TEXT NOT NULL,
    "feature" "DeactivatableFeature" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deactivable_features_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deactivable_features_statuses_feature_key" ON "deactivable_features_statuses"("feature");

-- AddForeignKey
ALTER TABLE "deactivable_features_statuses" ADD CONSTRAINT "deactivable_features_statuses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
