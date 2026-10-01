import { type Account, type User, Environment } from '@abc-transitionbascarbone/db'

export type AccountWithUser = Account & {
  user: User
  organizationVersion: { organizationId: string; environment: Environment } | null
}
