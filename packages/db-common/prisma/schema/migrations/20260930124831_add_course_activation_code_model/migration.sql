-- AlterTable
ALTER TABLE "bilan_carbone"."organization_versions" ADD COLUMN     "courseEndDate" TIMESTAMP(3),
ADD COLUMN     "courseStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bilan_carbone"."course_activation_code" (
    "organizationVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "course_activation_code_code_key" ON "bilan_carbone"."course_activation_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_activation_code_organizationVersionId_key" ON "bilan_carbone"."course_activation_code"("organizationVersionId");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_activation_code" ADD CONSTRAINT "course_activation_code_organizationVersionId_fkey" FOREIGN KEY ("organizationVersionId") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
