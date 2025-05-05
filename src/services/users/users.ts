import { getUsers } from '@/db/user'
import { updateUser } from '@/db/userImport'

export const lowercaseUsersEmails = async () => {
  const users = await getUsers()
  const capitalizedUsers = users.filter((user) => user.email !== user.email.toLowerCase())
  await Promise.all(capitalizedUsers.map((user) => updateUser(user.id, { email: user.email.toLowerCase() })))
  console.log(`Fait : ${capitalizedUsers.length} utilisateurs mis à jour`)
}
