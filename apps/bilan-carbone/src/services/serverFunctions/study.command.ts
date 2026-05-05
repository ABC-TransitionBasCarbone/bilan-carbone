import {
  ControlMode,
  Country,
  DayOfWeek,
  EngagementPhase,
  EstablishmentType,
  Export,
  Level,
  StudyResultUnit,
  StudyRole,
} from '@abc-transitionbascarbone/db-common/enums'
import { setCustomIssue, setCustomMessage } from '@abc-transitionbascarbone/lib'
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
      studentNumber: z.number().optional().nullable(),
      establishmentYear: z.number().int().max(new Date().getFullYear()).optional().nullable(),
      academy: z.string().optional(),
      establishmentType: z.enum(EstablishmentType).optional(),
    }),
  ),
})
export type SitesCommand = z.infer<typeof SitesCommandValidation>

export const StudyExportsCommandValidation = z.object({
  exports: z.array(z.enum(Export)),
  controlMode: z.enum(ControlMode).nullable().optional(),
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
  simplified: z.boolean().optional(),
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

export const ChangeStudySiteTiltSimplifiedValidation = z.object({
  postalCode: z.string().optional(),
  structure: z.string().optional(),
})

export type ChangeStudySiteTiltSimplifiedCommand = z.infer<typeof ChangeStudySiteTiltSimplifiedValidation>

export const ChangeStudyEstablishmentValidation = z.object({
  address: z.string().optional(),
  establishmentYear: z.string().optional(),
  etp: z.int().min(0).optional(),
  studentNumber: z.int().min(0).optional(),
  superficy: z.number().optional().nullable(),
  country: z.enum(Country).optional().nullable(),
})

export type ChangeStudyEstablishmentCommand = z.infer<typeof ChangeStudyEstablishmentValidation>

export const NewStudyRightCommandValidation = z.object({
  studyId: z.string(),
  email: z.email().trim(),
  role: z.enum(StudyRole),
})

export type NewStudyRightCommand = z.infer<typeof NewStudyRightCommandValidation>

export const NewStudyContributorCommandValidation = (requireNaming: boolean) =>
  z.intersection(
    z.object({
      studyId: z.string(),
      email: z.string().email().trim(),
      firstName: requireNaming ? z.string().min(1) : z.string().optional(),
      lastName: z.string().optional(),
    }),
    SubPostsCommandValidation,
  )

export type NewStudyContributorCommand = z.infer<ReturnType<typeof NewStudyContributorCommandValidation>>

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

export const AddEngagementActionCommandValidation = z.object({
  studyId: z.uuid(),
  name: z.string().min(1),
  date: dateValidation(),
  targets: z.array(z.string()).min(1),
  steps: z.string(),
  phase: z.enum(EngagementPhase),
  description: z.string(),
  sites: z.array(z.uuid()).min(1),
})

export type AddEngagementActionCommand = z.infer<typeof AddEngagementActionCommandValidation>
