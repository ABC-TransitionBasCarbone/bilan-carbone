-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rights" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);
