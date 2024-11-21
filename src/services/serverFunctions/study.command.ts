import { ControlMode, Export, Level, StudyRole, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import z from 'zod'
import { Post } from '../posts'

export const CreateStudyCommandValidation = z
  .object({
    organizationId: z.string(),
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
    startDate: z.string({ required_error: 'stardDate' }).refine((val) => {
      const date = dayjs(val)
      return date.isValid()
    }, 'startDate'),
    endDate: z.string({ required_error: 'endDate' }).refine((val) => {
      const date = dayjs(val)
      return date.isValid()
    }, 'endDate'),
    level: z.nativeEnum(Level, { required_error: 'level' }),
    isPublic: z.string(),
    exports: z.object({
      [Export.Beges]: z.nativeEnum(ControlMode).or(z.literal(false)),
      [Export.GHGP]: z.nativeEnum(ControlMode).or(z.literal(false)),
      [Export.ISO14069]: z.nativeEnum(ControlMode).or(z.literal(false)),
    }),
  })
  .refine(
    (data) => {
      return dayjs(data.endDate).isAfter(dayjs(data.startDate))
    },
    {
      message: 'endDateBeforStartDate',
      path: ['endDate'],
    },
  )

export type CreateStudyCommand = z.infer<typeof CreateStudyCommandValidation>

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

export const NewStudyContributorCommandValidation = z.object({
  studyId: z.string(),
  email: z
    .string({
      required_error: 'email',
    })
    .email('email')
    .trim(),
  post: z.union([z.nativeEnum(Post), z.literal('all')], { required_error: 'post' }),
  subPost: z.union([z.nativeEnum(SubPost), z.literal('all')]),
})

export type NewStudyContributorCommand = z.infer<typeof NewStudyContributorCommandValidation>
