import { setCustomIssue, setCustomMessage } from '@/lib/zod.config'
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
      cncCode: z.string().optional(),
      name: z.string().trim().min(1),
      etp: z.int().min(0).optional(),
      ca: z.number().min(0).optional(),
      selected: z.boolean().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      emissionSourcesCount: z.number().optional(),
      volunteerNumber: z.number().optional().nullable(),
      beneficiaryNumber: z.number().optional().nullable(),
    }),
  ),
})
export type SitesCommand = z.infer<typeof SitesCommandValidation>

export const StudyExportsCommandValidation = z.object({
  exports: z.object({
    [Export.Beges]: z.enum(ControlMode).or(z.literal(false)),
    [Export.GHGP]: z.enum(ControlMode).or(z.literal(false)),
    [Export.ISO14069]: z.enum(ControlMode).or(z.literal(false)),
  }),
})

export type StudyExportsCommand = z.infer<typeof StudyExportsCommandValidation>

const dateValidation = () => z.string().refine((val) => dayjs(val).isValid(), setCustomMessage('invalidDate'))

const optionalDateValidation = () =>
  z
    .string()
    .optional()
    .nullable()
    .refine((val) => val === null || dayjs(val).isValid(), setCustomMessage('invalidDate'))

const BaseStudyValidation = z.object({
  organizationVersionId: z.string(),
  name: z.string().trim().min(1),
  validator: z.email().trim(),
  startDate: dateValidation(),
  endDate: dateValidation(),
  realizationStartDate: optionalDateValidation(),
  realizationEndDate: optionalDateValidation(),
  level: z.enum(Level),
  isPublic: z.string(),
})

export const CreateStudyCommandValidation = z
  .intersection(z.intersection(BaseStudyValidation, StudyExportsCommandValidation), SitesCommandValidation)
  .superRefine((data, ctx) => {
    if (!dayjs(data.endDate).isAfter(dayjs(data.startDate))) {
      ctx.addIssue(setCustomIssue(['endDate'], 'endDateBeforeStartDate'))
    }
    if (
      data.realizationStartDate &&
      data.realizationEndDate &&
      !dayjs(data.realizationEndDate).isAfter(dayjs(data.realizationStartDate))
    ) {
      ctx.addIssue(setCustomIssue(['realizationEndDate'], 'endDateBeforStartDate'))
    }
    if (!data.sites.some((site) => site.selected)) {
      ctx.addIssue(setCustomIssue(['sites'], 'noSiteSelected'))
    }
  })

export type CreateStudyCommand = z.infer<typeof CreateStudyCommandValidation>

export const ChangeStudySitesCommandValidation = z
  .intersection(
    z.object({
      organizationId: z.string(),
    }),
    SitesCommandValidation,
  )
  .refine(({ sites }) => sites.some((site) => site.selected), { params: { message: 'noSiteSelected' } })
export type ChangeStudySitesCommand = z.infer<typeof ChangeStudySitesCommandValidation>

export const ChangeStudyPublicStatusCommandValidation = z.object({
  studyId: z.string(),
  isPublic: z.string(),
})

export type ChangeStudyPublicStatusCommand = z.infer<typeof ChangeStudyPublicStatusCommandValidation>

export const ChangeStudyLevelCommandValidation = z.object({
  studyId: z.string(),
  level: z.enum(Level),
})

export type ChangeStudyLevelCommand = z.infer<typeof ChangeStudyLevelCommandValidation>

export const ChangeStudyResultsUnitCommandValidation = z.object({
  studyId: z.string(),
  resultsUnit: z.enum(StudyResultUnit),
})

export type ChangeStudyResultsUnitCommand = z.infer<typeof ChangeStudyResultsUnitCommandValidation>

export const ChangeStudyDatesCommandValidation = z
  .object({
    studyId: z.string(),
    startDate: dateValidation(),
    endDate: dateValidation(),
    realizationStartDate: optionalDateValidation(),
    realizationEndDate: optionalDateValidation(),
  })
  .superRefine((data, ctx) => {
    if (!dayjs(data.endDate).isAfter(dayjs(data.startDate))) {
      ctx.addIssue(setCustomIssue(['endDate'], 'endDateBeforeStartDate'))
    }
    if (
      data.realizationStartDate &&
      data.realizationEndDate &&
      !dayjs(data.realizationEndDate).isAfter(dayjs(data.realizationStartDate))
    ) {
      ctx.addIssue(setCustomIssue(['realizationEndDate'], 'endDateBeforeStartDate'))
    }
  })

export type ChangeStudyDatesCommand = z.infer<typeof ChangeStudyDatesCommandValidation>

export const ChangeStudyNameValidation = z.object({
  studyId: z.string(),
  name: z.string().trim().min(1),
})

export type ChangeStudyNameCommand = z.infer<typeof ChangeStudyNameValidation>

export const ChangeStudyCinemaValidation = z.object({
  openingHours: z.partialRecord(z.enum(DayOfWeek), OpeningHoursValidation).optional(),
  openingHoursHoliday: z.partialRecord(z.enum(DayOfWeek), HolidayOpeningHoursValidation).optional(),
  numberOfSessions: z.number().optional().nullable(),
  numberOfTickets: z.number().optional().nullable(),
  numberOfOpenDays: z.number().optional().nullable(),
  numberOfProgrammedFilms: z.number().optional().nullable(),
})

export type ChangeStudyCinemaCommand = z.infer<typeof ChangeStudyCinemaValidation>

export const NewStudyRightCommandValidation = z.object({
  studyId: z.string(),
  email: z.email().trim(),
  role: z.enum(StudyRole),
})

export type NewStudyRightCommand = z.infer<typeof NewStudyRightCommandValidation>

export const NewStudyContributorCommandValidation = z.intersection(
  z.object({ studyId: z.string(), email: z.email().trim() }),
  SubPostsCommandValidation,
)

export type NewStudyContributorCommand = z.infer<typeof NewStudyContributorCommandValidation>

export const DeleteCommandValidation = z.object({
  id: z.string(),
  name: z.string(),
})
export type DeleteCommand = z.infer<typeof DeleteCommandValidation>

export const DuplicateSiteCommandValidation = z.object({
  sourceSiteId: z.uuid(),
  targetSiteIds: z.array(z.uuid()),
  newSitesCount: z.int().min(0),
  organizationId: z.uuid(),
  studyId: z.uuid(),
  fieldsToDuplicate: z.array(z.enum(['etp', 'ca', 'volunteerNumber', 'beneficiaryNumber', 'emissionSources'])),
})

export type DuplicateSiteCommand = z.infer<typeof DuplicateSiteCommandValidation>
