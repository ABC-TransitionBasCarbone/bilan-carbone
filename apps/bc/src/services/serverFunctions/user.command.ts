import { Country, Role, SiteCAUnit } from '@abc-transitionbascarbone/db-common/enums'
import z from 'zod'

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
  schoolName: z.string().min(1),
  city: z.string().optional(),
  country: z.enum(Country).optional().nullable(),
})

export type SignUpClicksonCommand = z.infer<typeof SignUpClicksonCommandValidation>
