import { Level, Role } from '@prisma/client'
import z from 'zod'

export const AddMemberCommandValidation = z.object({
  email: z
    .string({
      required_error: 'email',
    })
    .email('email')
    .trim(),
  firstName: z
    .string({
      required_error: 'firstName',
    })
    .trim()
    .min(1, 'firstName'),
  lastName: z
    .string({
      required_error: 'lastName',
    })
    .trim()
    .min(1, 'lastName'),
  level: z.nativeEnum(Level, { required_error: 'level' }),
  role: z.nativeEnum(Role, { required_error: 'role' }),
})

export type AddMemberCommand = z.infer<typeof AddMemberCommandValidation>

export const EditProfileCommandValidation = z.object({
  firstName: z
    .string({
      required_error: 'firstName',
    })
    .trim()
    .min(1, 'firstName'),
  lastName: z
    .string({
      required_error: 'lastName',
    })
    .trim()
    .min(1, 'lastName'),
})

export type EditProfileCommand = z.infer<typeof EditProfileCommandValidation>
