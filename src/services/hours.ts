import { DayOfWeek } from '@prisma/client'
import { z } from 'zod'

export const OpeningHoursValidation = z.object({
  day: z.nativeEnum(DayOfWeek, { required_error: 'day' }),
  isHoliday: z.boolean().default(false),
  openHour: z.string().optional(),
  closeHour: z.string().optional(),
})
