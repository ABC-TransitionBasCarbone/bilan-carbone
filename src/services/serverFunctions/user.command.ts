import { Role, SiteCAUnit } from '@prisma/client'
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
  firstName: z.string({ required_error: 'firstName' }),
  lastName: z.string({ required_error: 'lastName' }),
  companyName: z.string({ required_error: 'companyName' }),
  collaborators: z
    .array(
      z
        .object({
          accountId: z.string(),
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

export const EditSettingsCommandValidation = z.object({
  validatedEmissionSourcesOnly: z.boolean(),
  caUnit: z.nativeEnum(SiteCAUnit),
})

export type EditSettingsCommand = z.infer<typeof EditSettingsCommandValidation>

export const LoginCommandValidation = z.object({
  email: z.string({ required_error: 'email' }).email('email').trim(),
  password: z.string({ required_error: 'password' }).min(1, 'password'),
})

export type LoginCommand = z.infer<typeof LoginCommandValidation>

export const EmailCommandValidation = z.object({
  email: z.string({ required_error: 'email' }).email('email').trim(),
})

export type EmailCommand = z.infer<typeof EmailCommandValidation>

export const ResetPasswordCommandValidation = z.object({
  email: z.string({ required_error: 'email' }).email('email').trim(),
  password: z.string({ required_error: 'password' }),
  confirmPassword: z.string({ required_error: 'password' }),
})

export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandValidation>
