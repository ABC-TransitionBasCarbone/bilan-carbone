import { Role, SiteCAUnit } from '@prisma/client'
import z from 'zod'

export const AddMemberCommandValidation = z.object({
  email: z
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  firstName: z
    .string({
      error: (issue) => (issue.input === undefined ? 'firstName' : undefined),
    })
    .trim()
    .min(1, 'firstName'),
  lastName: z
    .string({
      error: (issue) => (issue.input === undefined ? 'lastName' : undefined),
    })
    .trim()
    .min(1, 'lastName'),
  role: z.enum(Role, {
    error: (issue) => (issue.input === undefined ? 'role' : undefined),
  }),
})

export type AddMemberCommand = z.infer<typeof AddMemberCommandValidation>

export const EditProfileCommandValidation = z.object({
  firstName: z
    .string({
      error: (issue) => (issue.input === undefined ? 'firstName' : undefined),
    })
    .trim()
    .min(1, 'firstName'),
  lastName: z
    .string({
      error: (issue) => (issue.input === undefined ? 'lastName' : undefined),
    })
    .trim()
    .min(1, 'lastName'),
})

export type EditProfileCommand = z.infer<typeof EditProfileCommandValidation>

export const OnboardingCommandValidation = z.object({
  organizationVersionId: z.string(),
  firstName: z.string({
    error: (issue) => (issue.input === undefined ? 'firstName' : undefined),
  }),
  lastName: z.string({
    error: (issue) => (issue.input === undefined ? 'lastName' : undefined),
  }),
  companyName: z.string({
    error: (issue) => (issue.input === undefined ? 'companyName' : undefined),
  }),
  collaborators: z
    .array(
      z
        .object({
          email: z
            .string()
            .trim()
            .transform((email) => email.toLowerCase())
            .optional(),
          role: z.enum(Role).optional(),
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
  caUnit: z.enum(SiteCAUnit),
})

export type EditSettingsCommand = z.infer<typeof EditSettingsCommandValidation>

export const LoginCommandValidation = z.object({
  email: z.email('email').trim(),
  password: z
    .string({
      error: (issue) => (issue.input === undefined ? 'password' : undefined),
    })
    .min(1, 'password'),
})

export type LoginCommand = z.infer<typeof LoginCommandValidation>

export const EmailCommandValidation = z.object({
  email: z
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
})

export type EmailCommand = z.infer<typeof EmailCommandValidation>

export const ResetPasswordCommandValidation = z.object({
  email: z
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  password: z.string({
    error: (issue) => (issue.input === undefined ? 'password' : undefined),
  }),
  confirmPassword: z.string({
    error: (issue) => (issue.input === undefined ? 'password' : undefined),
  }),
})

export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandValidation>

export const SignUpCutCommandValidation = z.object({
  email: z
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  siretOrCNC: z
    .string({
      error: (issue) => (issue.input === undefined ? 'siretOrCNC' : undefined),
    })
    .max(14)
    .optional(),
})

export type SignUpCutCommand = z.infer<typeof SignUpCutCommandValidation>

export const SignUpTiltCommandValidation = z.object({
  email: z
    .email('email')
    .trim()
    .transform((email) => email.toLowerCase()),
  siret: z
    .string({
      error: (issue) => (issue.input === undefined ? 'siret' : undefined),
    })
    .trim()
    .min(14, 'siret')
    .max(14, 'siret'),
})

export type SignUpTiltCommand = z.infer<typeof SignUpTiltCommandValidation>
