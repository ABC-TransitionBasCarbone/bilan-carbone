import { assignTrainingCorrectionExerciseStudy } from '@/services/serverFunctions/study'
import { Command } from 'commander'

const program = new Command()

program
  .name('assign-correction-training-study')
  .description('Script pour assigner une étude de correction aux utilisateurs à la fin de leur formation')
  .version('1.0.0')

const assignTainingStudy = async () => {
  const res = await assignTrainingCorrectionExerciseStudy()
  console.log(`Correction studies created for the following formations : ${res.join(', ')}`)
}

assignTainingStudy()
