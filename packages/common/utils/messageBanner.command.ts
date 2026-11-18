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
    active: z.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    path: ['endDate'],
    message: 'endDateBeforeStartDate',
  })

export type MessageBannerCommand = z.infer<typeof CommonMessageBannerCommandValidation>
