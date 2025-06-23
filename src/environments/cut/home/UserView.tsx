import { Box } from '@mui/material'

import StudiesContainer from '@/components/study/StudiesContainer'
import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { UserSession } from 'next-auth'
import HomeNavigation from './HomeNavigation'
import styles from './UserView.module.css'

interface Props {
  account: UserSession
}

const UserView = async ({ account }: Props) => {
  const [organizationVersions] = await Promise.all([getAccountOrganizationVersions(account.accountId)])

  const userOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const isCR = userOrganizationVersion?.isCR

  return (
    <Box component="section" className={styles.container}>
      <HomeNavigation />
      <StudiesContainer user={account} isCR={isCR} />
    </Box>
  )
}

export default UserView
