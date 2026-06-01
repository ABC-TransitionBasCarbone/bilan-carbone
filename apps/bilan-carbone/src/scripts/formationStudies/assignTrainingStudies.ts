import { assignTrainingCorrectionExerciseStudy, assignTrainingExerciseStudy } from '@/services/serverFunctions/study'
import { formatDateFr } from '@abc-transitionbascarbone/utils'

export const assignTrainingStudies = async () => {
  const trainingRes = await assignTrainingExerciseStudy()
  const date = new Date()
  console.log(
    `Training studies assigned (${formatDateFr(date)}) -> ${trainingRes.created} studies created; ${trainingRes.error} errors`,
  )

  const correctionRes = await assignTrainingCorrectionExerciseStudy()
  console.log(`Correction studies created for the following formations : ${correctionRes.join(', ')}`)
}
