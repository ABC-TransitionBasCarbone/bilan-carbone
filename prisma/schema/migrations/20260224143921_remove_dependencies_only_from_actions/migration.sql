/*
  Warnings:

  - You are about to drop the column `dependencies_only` on the `actions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "actions" DROP COLUMN "dependencies_only";

-- CreateTable
CREATE TABLE "action_sites" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "study_site_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_tags" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "study_tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_subposts" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_subposts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_sites_action_id_study_site_id_key" ON "action_sites"("action_id", "study_site_id");

-- CreateIndex
CREATE UNIQUE INDEX "action_tags_action_id_study_tag_id_key" ON "action_tags"("action_id", "study_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "action_subposts_action_id_subPost_key" ON "action_subposts"("action_id", "subPost");

-- AddForeignKey
ALTER TABLE "action_sites" ADD CONSTRAINT "action_sites_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_sites" ADD CONSTRAINT "action_sites_study_site_id_fkey" FOREIGN KEY ("study_site_id") REFERENCES "study_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_tags" ADD CONSTRAINT "action_tags_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_tags" ADD CONSTRAINT "action_tags_study_tag_id_fkey" FOREIGN KEY ("study_tag_id") REFERENCES "study_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_subposts" ADD CONSTRAINT "action_subposts_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
