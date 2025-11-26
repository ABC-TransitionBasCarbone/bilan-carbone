import { DayOfWeek } from '@prisma/client'
import { z } from 'zod'

export const OpeningHoursValidation = z.object({
  id: z.string().optional(),
  day: z.enum(DayOfWeek),
  isHoliday: z.boolean().refine((val) => val === false),
  openHour: z.string().optional().nullable(),
  closeHour: z.string().optional().nullable(),
})

export const HolidayOpeningHoursValidation = OpeningHoursValidation.extend({
  isHoliday: z.boolean().refine((val) => val === true),
})
