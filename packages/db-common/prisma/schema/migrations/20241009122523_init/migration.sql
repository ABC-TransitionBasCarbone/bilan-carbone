-- CreateTable
CREATE TABLE "actualities" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "actualities_pkey" PRIMARY KEY ("id")
);
