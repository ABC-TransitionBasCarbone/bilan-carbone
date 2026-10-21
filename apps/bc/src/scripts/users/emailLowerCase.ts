import { lowercaseUsersEmails } from '@/services/serverFunctions/user'
import { Command } from 'commander'

const program = new Command()

program
  .name('lowercase-users-emails')
  .description('Script pour changer les emails des utilisateurs en lowerCase')
  .version('1.0.0')
  .parse(process.argv)

lowercaseUsersEmails()
