import { assignTrainingCorrectionExerciseStudy, assignTrainingExerciseStudy } from '@/services/serverFunctions/study'
import { formatDateFr } from '@/utils/time'
import { Command } from 'commander'

const program = new Command()

program
  .name('assign-training-studies')
  .description(
    "Script pour assigner une étude d'entrainement aux utilisateurs au début de leur formation et à la finb de leur formation",
  )
  .version('1.0.0')

const assignTrainingStudies = async () => {
  const trainingRes = await assignTrainingExerciseStudy()
  const date = new Date()
  console.log(
    `Training studies assigned (${formatDateFr(date)}) -> ${trainingRes.created} studies created; ${trainingRes.error} errors`,
  )

  const correctionRes = await assignTrainingCorrectionExerciseStudy()
  console.log(`Correction studies created for the following formations : ${correctionRes.join(', ')}`)
}

assignTrainingStudies()
