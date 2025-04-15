-- CreateTable
CREATE TABLE "user_application_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "validated_emission_sources_only" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_application_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_application_settings_user_id_key" ON "user_application_settings"("user_id");

-- AddForeignKey
ALTER TABLE "user_application_settings" ADD CONSTRAINT "user_application_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
