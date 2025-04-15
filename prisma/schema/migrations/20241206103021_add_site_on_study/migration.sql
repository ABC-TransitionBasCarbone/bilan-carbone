-- CreateTable
CREATE TABLE "StudySite" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "etp" INTEGER NOT NULL,
    "ca" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StudySite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudySite" ADD CONSTRAINT "StudySite_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySite" ADD CONSTRAINT "StudySite_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
