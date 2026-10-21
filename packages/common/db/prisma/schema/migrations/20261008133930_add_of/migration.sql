-- CreateTable
CREATE TABLE "bilan_carbone"."course_organism" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "ftp_path" TEXT NOT NULL,

    CONSTRAINT "course_organism_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_organism_name_key" ON "bilan_carbone"."course_organism"("name");
