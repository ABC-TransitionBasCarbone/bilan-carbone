-- CreateTable
CREATE TABLE "situations" (
    "id" TEXT NOT NULL,
    "situation" JSONB NOT NULL,
    "study_site_id" TEXT NOT NULL,
    "publicodes_version" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "situations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "situations_study_site_id_key" ON "situations"("study_site_id");

-- AddForeignKey
ALTER TABLE "situations" ADD CONSTRAINT "situations_study_site_id_fkey" FOREIGN KEY ("study_site_id") REFERENCES "study_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
