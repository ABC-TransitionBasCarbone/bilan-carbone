import { Role } from '@abc-transitionbascarbone/common/db/enums'
import z from 'zod'

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
