import z from 'zod'

export const CorrectionSharingSelectionValidation = z.object({
  studyId: z.uuid(),
  courseSessionId: z.uuid(),
})

export const RecordCorrectionSharingValidation = CorrectionSharingSelectionValidation.extend({
  includePlan: z.boolean(),
  confirmationName: z.string().min(1),
  targetSnapshot: z.string().min(1),
})

export type CorrectionSharingSelection = z.infer<typeof CorrectionSharingSelectionValidation>
export type RecordCorrectionSharingCommand = z.infer<typeof RecordCorrectionSharingValidation>
