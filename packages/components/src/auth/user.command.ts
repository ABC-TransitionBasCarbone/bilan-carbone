import z from 'zod'
export const LoginCommandValidation = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
})

export type LoginCommand = z.infer<typeof LoginCommandValidation>