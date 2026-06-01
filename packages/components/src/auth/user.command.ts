import z from 'zod'
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
