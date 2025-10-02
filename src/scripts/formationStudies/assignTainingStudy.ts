import { assignTrainingExerciseStudy } from '@/services/serverFunctions/study'
import { formatDateFr } from '@/utils/time'
import { Command } from 'commander'

const program = new Command()

program
  .name('assign-training-study')
  .description("Script pour assigner une étude d'entrainement aux utilisateurs au début de leur formation")
  .version('1.0.0')

const assignTainingStudy = async () => {
  const res = await assignTrainingExerciseStudy()
  const date = new Date()
  console.log(
    `Training studies assigned (${formatDateFr(date)}) -> ${res.created} studies created; ${res.error} errors`,
  )
}

assignTainingStudy()
