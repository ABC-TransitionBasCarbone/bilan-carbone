import { resetUserFeedbackDate } from '@/db/user'
import { Command } from 'commander'

const program = new Command()

program
  .name('reset-users-date')
  .description('Script pour réinitialiser les date de feedback pour tous les utilisateurs')
  .version('1.0.0')
  .parse(process.argv)

resetUserFeedbackDate()
