import { getUsers } from '@/db/user'
import { updateUser } from '@/db/userImport'

export const lowercaseUsersEmails = async () => {
  const users = await getUsers()

  const duplicated = users.filter(
    (user) => users.filter((u) => u.email.toLowerCase() === user.email.toLowerCase()).length > 1,
  )
  if (duplicated.length > 1) {
    const emails = duplicated.map((user) => user.email)
    console.log(`Migration impossible, il existe ${emails.length} adresses mail dupliquées : `)
    emails.sort((a, b) => a.localeCompare(b)).forEach((email) => console.log(`- ${email}`))
    console.log('Veuillez régler ces conflicts en premier lieu')
  } else {
    const capitalizedUsers = users.filter((user) => user.email !== user.email.toLowerCase())
    await Promise.all(capitalizedUsers.map((user) => updateUser(user.id, { email: user.email.toLowerCase() })))
    console.log(`Fait : ${capitalizedUsers.length} utilisateurs mis à jour`)
  }
}
