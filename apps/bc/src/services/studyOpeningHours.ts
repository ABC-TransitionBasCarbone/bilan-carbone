import { prismaClient } from '@/db/client.server'
import type { ChangeStudyCinemaCommand } from '@/services/serverFunctions/study.command'

export const updateStudyOpeningHours = async (
  studySiteId: string,
  openingHours: ChangeStudyCinemaCommand['openingHours'],
  openingHoursHoliday: ChangeStudyCinemaCommand['openingHoursHoliday'],
) =>
  prismaClient.$transaction(async (transaction) => {
    const existingOpeningHours = await transaction.openingHours.findMany({
      where: { studySiteId },
      select: { id: true },
    })
    const mergedOpeningHours = [...Object.values(openingHours || {}), ...Object.values(openingHoursHoliday || {})]
    const existingIds = new Set(existingOpeningHours.map((openingHour) => openingHour.id))
    const updateIds = new Set(mergedOpeningHours.map((openingHour) => openingHour.id))
    const openingHourIdsToDelete = [...existingIds].filter((id) => !updateIds.has(id))

    if (openingHourIdsToDelete.length > 0) {
      await transaction.openingHours.deleteMany({ where: { id: { in: openingHourIdsToDelete } } })
    }

    await Promise.all(
      mergedOpeningHours.map((openingHour) =>
        openingHour.id
          ? transaction.openingHours.update({ where: { id: openingHour.id }, data: openingHour })
          : transaction.openingHours.create({
              data: { ...openingHour, studySite: { connect: { id: studySiteId } } },
            }),
      ),
    )
  })
