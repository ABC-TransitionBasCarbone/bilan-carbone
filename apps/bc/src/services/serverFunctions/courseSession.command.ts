import z from 'zod'

export const AddCourseSessionTraineeCommandValidation = z.object({
  lastName: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  confirmedTransferFrom: z.array(z.string().min(1)).optional(),
})

export type AddCourseSessionTraineeCommand = z.infer<typeof AddCourseSessionTraineeCommandValidation>
