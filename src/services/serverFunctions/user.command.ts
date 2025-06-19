import { Role, SiteCAUnit } from '@prisma/client'
import z from 'zod'

export const AddMemberCommandValidation = z.object({
  email: z
    .string({
      required_error: 'email',
    })
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
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
  organizationVersionId: z.string(),
  firstName: z.string({ required_error: 'firstName' }),
  lastName: z.string({ required_error: 'lastName' }),
  companyName: z.string({ required_error: 'companyName' }),
  collaborators: z
    .array(
      z
        .object({
          email: z
            .string()
            .trim()
            .transform((email) => email.toLowerCase())
            .optional(),
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
            const emailValidation = z
              .string()
              .email()
              .transform((val) => val.toLowerCase())
              .safeParse(email)
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
  email: z
    .string({ required_error: 'email' })
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
})

export type EmailCommand = z.infer<typeof EmailCommandValidation>

export const ResetPasswordCommandValidation = z.object({
  email: z
    .string({ required_error: 'email' })
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  password: z.string({ required_error: 'password' }),
  confirmPassword: z.string({ required_error: 'password' }),
})

export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandValidation>

export const SignUpCutCommandValidation = z.object({
  email: z
    .string({ required_error: 'email' })
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  siretOrCNC: z.string({ required_error: 'siretOrCNC' }).trim().min(1, 'siretOrCNC'),
})

export type SignUpCutCommand = z.infer<typeof SignUpCutCommandValidation>
