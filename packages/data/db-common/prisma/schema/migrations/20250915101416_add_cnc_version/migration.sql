-- AlterTable
ALTER TABLE "public"."cncs" ADD COLUMN     "cnc_version_id" TEXT;

-- AlterTable
ALTER TABLE "public"."study_sites" ADD COLUMN     "cnc_version_id" TEXT;

-- CreateTable
CREATE TABLE "public"."cnc_versions" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cnc_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cnc_versions_year_key" ON "public"."cnc_versions"("year");

-- AddForeignKey
ALTER TABLE "public"."cncs" ADD CONSTRAINT "cncs_cnc_version_id_fkey" FOREIGN KEY ("cnc_version_id") REFERENCES "public"."cnc_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_sites" ADD CONSTRAINT "study_sites_cnc_version_id_fkey" FOREIGN KEY ("cnc_version_id") REFERENCES "public"."cnc_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
