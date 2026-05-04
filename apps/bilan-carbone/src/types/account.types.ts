import { type Account, type User, Environment } from '@repo/db-common'

export type AccountWithUser = Account & {
  user: User
  organizationVersion: { organizationId: string; environment: Environment }
}
