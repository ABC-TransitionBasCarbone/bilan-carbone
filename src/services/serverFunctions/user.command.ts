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

export const OnboardingCommandValidation = z.object({
  organizationId: z.string(),
  companyName: z.string({ required_error: 'companyName' }),
  role: z.nativeEnum(Role, { required_error: 'role' }),
  collaborators: z
    .array(
      z
        .object({
          email: z.string().trim().optional(),
          role: z.nativeEnum(Role).optional(),
        })
        .superRefine((collaborator, ctx) => {
          const { email, role } = collaborator
          if (role !== undefined && email === '') {
            ctx.addIssue({ code: 'custom', path: ['email'], message: 'requiredEmail' })
          }
          if (role === undefined && email !== '') {
            ctx.addIssue({ code: 'custom', path: ['role'], message: 'requiredRole' })
          }
          if (email !== '' && role !== undefined) {
            const emailValidation = z.string().email().safeParse(email)
            if (!emailValidation.success) {
              ctx.addIssue({ code: 'custom', path: ['email'], message: 'email' })
            }
          }
        }),
    )
    .optional(),
})
export type OnboardingCommand = z.infer<typeof OnboardingCommandValidation>
