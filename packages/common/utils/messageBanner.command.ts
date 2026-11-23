import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { z } from 'zod'

export const mipMessageBannerEnvironments: Environment[] = [Environment.MIP]

export const CommonMessageBannerCommandValidation = z
  .object({
    id: z.uuid().optional(),
    message: z.string().trim().min(1),
    environments: z.array(z.enum(Environment)).min(1),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    path: ['endDate'],
    message: 'endDateBeforeStartDate',
  })

export type MessageBannerCommand = z.infer<typeof CommonMessageBannerCommandValidation>

export const makeMessageBannerCommandValidation = (allowedEnvironments: Environment[]) =>
  CommonMessageBannerCommandValidation.refine(
    (data) => data.environments.every((environment) => allowedEnvironments.includes(environment)),
    { path: ['environments'], message: 'notAuthorized' },
  )
