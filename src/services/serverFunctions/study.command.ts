import { ControlMode, DayOfWeek, Export, Level, StudyResultUnit, StudyRole } from '@prisma/client'
import dayjs from 'dayjs'
import z from 'zod'
import { HolidayOpeningHoursValidation, OpeningHoursValidation } from '../hours'
import { SubPostsCommandValidation } from './emissionFactor.command'

export const SitesCommandValidation = z.object({
  sites: z.array(
    z.object({
      id: z.string(),
      cncId: z.string().optional(),
      cncNumeroAuto: z.string().optional(),
      name: z
        .string({
          required_error: 'name',
        })
        .trim()
        .min(1, 'name'),
      etp: z
        .number({ required_error: 'etp', invalid_type_error: 'etp' })
        .int('etp')
        .min(0, { message: 'etp' })
        .optional(),
      ca: z.number({ required_error: 'ca', invalid_type_error: 'ca' }).min(0, { message: 'ca' }).optional(),
      selected: z.boolean().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      emissionSourcesCount: z.number().optional(),
    }),
  ),
})
export type SitesCommand = z.infer<typeof SitesCommandValidation>

export const StudyExportsCommandValidation = z.object({
  exports: z.object({
    [Export.Beges]: z.nativeEnum(ControlMode).or(z.literal(false)),
    [Export.GHGP]: z.nativeEnum(ControlMode).or(z.literal(false)),
    [Export.ISO14069]: z.nativeEnum(ControlMode).or(z.literal(false)),
  }),
})

export type StudyExportsCommand = z.infer<typeof StudyExportsCommandValidation>

const dateValidation = (field: string) =>
  z.string({ required_error: field }).refine((val) => dayjs(val).isValid(), field)

const optionalDateValidation = (field: string) =>
  z
    .string()
    .optional()
    .nullable()
    .refine((val) => val === null || dayjs(val).isValid(), field)

const BaseStudyValidation = z.object({
  organizationVersionId: z.string(),
  name: z
    .string({
      required_error: 'name',
    })
    .trim()
    .min(1, 'name'),
  validator: z
    .string({
      required_error: 'validator',
      invalid_type_error: 'validator',
    })
    .email('validator')
    .trim(),
  startDate: dateValidation('startDate'),
  endDate: dateValidation('endDate'),
  realizationStartDate: optionalDateValidation('startDate'),
  realizationEndDate: optionalDateValidation('endDate'),
  level: z.nativeEnum(Level, { required_error: 'level' }),
  isPublic: z.string(),
})

export const CreateStudyCommandValidation = z
  .intersection(z.intersection(BaseStudyValidation, StudyExportsCommandValidation), SitesCommandValidation)
  .refine((data) => dayjs(data.endDate).isAfter(dayjs(data.startDate)), {
    message: 'endDateBeforStartDate',
    path: ['endDate'],
  })
  .refine(
    (data) =>
      !data.realizationStartDate ||
      !data.realizationEndDate ||
      dayjs(data.realizationEndDate).isAfter(dayjs(data.realizationStartDate)),
    {
      message: 'endDateBeforStartDate',
      path: ['realizationEndDate'],
    },
  )
  .refine(({ sites }) => sites.some((site) => site.selected), 'sites')

export type CreateStudyCommand = z.infer<typeof CreateStudyCommandValidation>

export const ChangeStudySitesCommandValidation = z
  .intersection(
    z.object({
      organizationId: z.string(),
    }),
    SitesCommandValidation,
  )
  .refine(({ sites }) => sites.some((site) => site.selected), 'sites')
export type ChangeStudySitesCommand = z.infer<typeof ChangeStudySitesCommandValidation>

export const ChangeStudyPublicStatusCommandValidation = z.object({
  studyId: z.string(),
  isPublic: z.string(),
})

export type ChangeStudyPublicStatusCommand = z.infer<typeof ChangeStudyPublicStatusCommandValidation>

export const ChangeStudyLevelCommandValidation = z.object({
  studyId: z.string(),
  level: z.nativeEnum(Level),
})

export type ChangeStudyLevelCommand = z.infer<typeof ChangeStudyLevelCommandValidation>

export const ChangeStudyResultsUnitCommandValidation = z.object({
  studyId: z.string(),
  resultsUnit: z.nativeEnum(StudyResultUnit),
})

export type ChangeStudyResultsUnitCommand = z.infer<typeof ChangeStudyResultsUnitCommandValidation>

export const ChangeStudyDatesCommandValidation = z
  .object({
    studyId: z.string(),
    startDate: dateValidation('startDate'),
    endDate: dateValidation('endDate'),
    realizationStartDate: optionalDateValidation('startDate'),
    realizationEndDate: optionalDateValidation('endDate'),
  })
  .refine((data) => dayjs(data.endDate).isAfter(dayjs(data.startDate)), {
    message: 'endDateBeforStartDate',
    path: ['endDate'],
  })
  .refine(
    (data) =>
      !data.realizationStartDate ||
      !data.realizationEndDate ||
      dayjs(data.realizationEndDate).isAfter(dayjs(data.realizationStartDate)),
    {
      message: 'endDateBeforStartDate',
      path: ['realizationEndDate'],
    },
  )

export type ChangeStudyDatesCommand = z.infer<typeof ChangeStudyDatesCommandValidation>

export const ChangeStudyNameValidation = z.object({
  studyId: z.string(),
  name: z
    .string({
      required_error: 'name',
    })
    .trim()
    .min(1, 'name'),
})

export type ChangeStudyNameCommand = z.infer<typeof ChangeStudyNameValidation>

export const ChangeStudyCinemaValidation = z.object({
  openingHours: z.record(z.nativeEnum(DayOfWeek), OpeningHoursValidation).optional(),
  openingHoursHoliday: z.record(z.nativeEnum(DayOfWeek), HolidayOpeningHoursValidation).optional(),
  numberOfSessions: z.number().optional().nullable(),
  numberOfTickets: z.number().optional().nullable(),
  numberOfOpenDays: z.number().optional().nullable(),
  distanceToParis: z.number().optional().nullable(),
})

export type ChangeStudyCinemaCommand = z.infer<typeof ChangeStudyCinemaValidation>

export const NewStudyRightCommandValidation = z.object({
  studyId: z.string(),
  email: z
    .string({
      required_error: 'emailRequired',
      invalid_type_error: 'emailRequired',
    })
    .email('email')
    .trim(),
  role: z.nativeEnum(StudyRole, { required_error: 'role' }),
})

export type NewStudyRightCommand = z.infer<typeof NewStudyRightCommandValidation>

export const NewStudyContributorCommandValidation = z.intersection(
  z.object({ studyId: z.string(), email: z.string({ required_error: 'email' }).email('email').trim() }),
  SubPostsCommandValidation,
)

export type NewStudyContributorCommand = z.infer<typeof NewStudyContributorCommandValidation>

export const DeleteCommandValidation = z.object({
  id: z.string(),
  name: z.string(),
})
export type DeleteCommand = z.infer<typeof DeleteCommandValidation>
