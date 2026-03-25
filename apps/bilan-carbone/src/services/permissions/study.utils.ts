import { isAdminOnOrga  } from '@/utils/organization'
import { UserSession } from 'next-auth'

export const isAdminOnStudyOrga = (
  user: UserSession,
  studyOrganizationVersion: {
    id: string
    parentId: string | null
  },
) => isAdminOnOrga(user, studyOrganizationVersion)