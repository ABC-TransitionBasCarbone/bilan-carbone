-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "city" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "numberOfOpenDays" INTEGER,
ADD COLUMN     "numberOfSessions" INTEGER,
ADD COLUMN     "numberOfTickets" INTEGER;

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "day" "DayOfWeek" NOT NULL,
    "openHour" TEXT,
    "closeHour" TEXT,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
