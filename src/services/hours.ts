import { DayOfWeek } from '@prisma/client'
import { z } from 'zod'

export const OpeningHoursValidation = z.object({
  id: z.string().optional(),
  day: z.nativeEnum(DayOfWeek),
  isHoliday: z.boolean().default(false).optional(),
  openHour: z.string().optional().nullable(),
  closeHour: z.string().optional().nullable(),
})
