import { User } from 'next-auth'

export const hasAccessToFormation = (user: User) => {
  if (!user.level) {
    return false
  }
  return true
}
