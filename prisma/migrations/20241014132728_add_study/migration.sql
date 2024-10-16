-- CreateEnum
CREATE TYPE "Export" AS ENUM ('Beges', 'GHGP', 'ISO14069');

-- CreateEnum
CREATE TYPE "ControlMode" AS ENUM ('CapitalShare', 'Financial', 'Operational');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('Initial', 'Standard', 'Advanced');

-- CreateTable
CREATE TABLE "studies" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "type" "StudyType" NOT NULL,

    CONSTRAINT "studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_exports" (
    "study_id" TEXT NOT NULL,
    "type" "Export" NOT NULL,
    "control" "ControlMode" NOT NULL,

    CONSTRAINT "study_exports_pkey" PRIMARY KEY ("study_id","type")
);

-- AddForeignKey
ALTER TABLE "study_exports" ADD CONSTRAINT "study_exports_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
