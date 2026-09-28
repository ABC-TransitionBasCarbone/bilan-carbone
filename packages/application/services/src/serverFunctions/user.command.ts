import z from 'zod'
import { Role } from '@abc-transitionbascarbone/db-common/enums'

export const AddMemberCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: z.enum(Role),
})

export type AddMemberCommand = z.infer<typeof AddMemberCommandValidation>