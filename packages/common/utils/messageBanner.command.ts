import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { z } from 'zod'

export const mipMessageBannerEnvironments: Environment[] = [Environment.MIP]

export const MessageBannerCommandValidation = z
  .object({
    id: z.uuid().optional(),
    message: z.string().trim().min(1),
    environments: z.array(z.enum(Environment)).min(1),
    startAt: z.date(),
    endAt: z.date(),
    active: z.boolean(),
  })
  .refine((data) => data.endAt > data.startAt, {
    path: ['endAt'],
    message: 'endDateBeforeStartDate',
  })

export type MessageBannerCommand = z.infer<typeof MessageBannerCommandValidation>
