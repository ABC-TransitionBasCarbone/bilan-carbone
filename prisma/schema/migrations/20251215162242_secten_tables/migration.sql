-- CreateTable
CREATE TABLE "secten_version" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secten_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secten_info" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "industry" INTEGER NOT NULL,
    "waste" INTEGER NOT NULL,
    "buildings" INTEGER NOT NULL,
    "agriculture" INTEGER NOT NULL,
    "transportation" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "version_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secten_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secten_version_name_key" ON "secten_version"("name");

-- CreateIndex
CREATE INDEX "secten_info_version_id_idx" ON "secten_info"("version_id");

-- CreateIndex
CREATE INDEX "secten_info_year_idx" ON "secten_info"("year");

-- CreateIndex
CREATE UNIQUE INDEX "secten_info_version_id_year_key" ON "secten_info"("version_id", "year");

-- AddForeignKey
ALTER TABLE "secten_info" ADD CONSTRAINT "secten_info_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "secten_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;
