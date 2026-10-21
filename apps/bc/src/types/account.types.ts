import { type Account, type User, Environment } from '@abc-transitionbascarbone/common/db'

export type AccountWithUser = Account & {
  user: Omit<User, 'password' | 'resetToken'>
  organizationVersion: { organizationId: string; environment: Environment } | null
}
