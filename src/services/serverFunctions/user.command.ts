import { Role, SiteCAUnit } from '@prisma/client'
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

export const EditProfileCommandValidation = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
})

export type EditProfileCommand = z.infer<typeof EditProfileCommandValidation>

export const OnboardingCommandValidation = z.object({
  organizationVersionId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  collaborators: z
    .array(
      z.union([
        z.object({ email: z.literal(''), role: z.undefined() }),
        z.object({
          email: z
            .email()
            .trim()
            .transform((email) => email.toLowerCase()),
          role: z.enum(Role),
        }),
      ]),
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
  email: z.email().trim(),
  password: z.string().min(1),
})

export type LoginCommand = z.infer<typeof LoginCommandValidation>

export const EmailCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
})

export type EmailCommand = z.infer<typeof EmailCommandValidation>

export const ResetPasswordCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
})

export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandValidation>

export const SignUpCutCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
  siretOrCNC: z.string().min(1).max(14).optional(),
})

export type SignUpCutCommand = z.infer<typeof SignUpCutCommandValidation>

export const SignUpTiltCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
  siret: z.string().min(14).max(14).trim(),
})

export type SignUpTiltCommand = z.infer<typeof SignUpTiltCommandValidation>

export const SignUpClicksonCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
  schoolName: z.string(),
})

export type SignUpClicksonCommand = z.infer<typeof SignUpClicksonCommandValidation>
