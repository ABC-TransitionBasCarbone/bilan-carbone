import { type AccountMip } from '@abc-transitionbascarbone/common/db'

export type AccountMipWithUser = AccountMip & {
  user: { id: string; firstName: string; lastName: string; email: string }
  organizationVersionMip: { organizationId: string }
}
