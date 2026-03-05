-- CreateTable
CREATE TABLE "objective_sites" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "study_site_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_tags" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "study_tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_subposts" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objective_subposts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "objective_sites_objective_id_study_site_id_key" ON "objective_sites"("objective_id", "study_site_id");

-- CreateIndex
CREATE UNIQUE INDEX "objective_tags_objective_id_study_tag_id_key" ON "objective_tags"("objective_id", "study_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "objective_subposts_objective_id_subPost_key" ON "objective_subposts"("objective_id", "subPost");

-- AddForeignKey
ALTER TABLE "objective_sites" ADD CONSTRAINT "objective_sites_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_sites" ADD CONSTRAINT "objective_sites_study_site_id_fkey" FOREIGN KEY ("study_site_id") REFERENCES "study_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_tags" ADD CONSTRAINT "objective_tags_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_tags" ADD CONSTRAINT "objective_tags_study_tag_id_fkey" FOREIGN KEY ("study_tag_id") REFERENCES "study_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_subposts" ADD CONSTRAINT "objective_subposts_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
