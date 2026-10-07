import { type Account, type User, Environment } from '@abc-transitionbascarbone/common/db'

export type AccountWithUser = Account & {
  user: User
  organizationVersion: { organizationId: string; environment: Environment } | null
}
