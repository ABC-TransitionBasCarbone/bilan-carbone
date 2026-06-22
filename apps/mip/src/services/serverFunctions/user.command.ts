import z from 'zod'

export const SignUpCommandValidation = z.object({
  email: z
    .email()
    .trim()
    .transform((email) => email.toLowerCase()),
})

export type SignUpCommand = z.infer<typeof SignUpCommandValidation>
