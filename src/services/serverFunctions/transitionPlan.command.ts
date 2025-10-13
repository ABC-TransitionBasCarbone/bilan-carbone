import dayjs from 'dayjs'
import z from 'zod'

export const ExternalStudyCommandValidation = z.object({
  transitionPlanId: z.string({ required_error: 'required' }),
  name: z.string({ required_error: 'required' }),
  date: z.string({ required_error: 'required' }).refine((val) => dayjs(val).isValid(), 'date'),
  totalCo2: z.number({ required_error: 'required' }),
})

export type ExternalStudyCommand = z.infer<typeof ExternalStudyCommandValidation>
