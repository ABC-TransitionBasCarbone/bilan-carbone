import type { CourseAccess } from '@/utils/training'
import { type Account, type User, Environment } from '@abc-transitionbascarbone/common/db'

export type AccountWithUser = Account & {
  courseAccess?: CourseAccess
  user: Omit<User, 'password' | 'resetToken'>
  organizationVersion: { organizationId: string; environment: Environment } | null
}
