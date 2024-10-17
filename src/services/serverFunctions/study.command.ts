import { ControlMode, Export, StudyType } from '@prisma/client'
import dayjs, { Dayjs } from 'dayjs'
import z from 'zod'

export const CreateStudyCommandValidation = z
  .object({
    organizationId: z.string(),
    name: z
      .string({
        required_error: 'name',
      })
      .trim()
      .min(1, 'name'),
    startDate: z.custom<Dayjs>((val) => val instanceof dayjs, 'startDate'),
    endDate: z.custom<Dayjs>((val) => val instanceof dayjs, 'endDate'),
    type: z.nativeEnum(StudyType, { required_error: 'type' }),
    isPublic: z.boolean(),
    exports: z.object({
      [Export.Beges]: z.nativeEnum(ControlMode).or(z.literal(false)),
      [Export.GHGP]: z.nativeEnum(ControlMode).or(z.literal(false)),
      [Export.ISO14069]: z.nativeEnum(ControlMode).or(z.literal(false)),
    }),
  })
  .refine(
    (data) => {
      return data.endDate > data.startDate
    },
    {
      message: 'endDateBeforStartDate',
      path: ['endDate'],
    },
  )

export type CreateStudyCommand = z.infer<typeof CreateStudyCommandValidation>
