import ChecklistButton from '@/components/checklist/ChecklistButton'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import OrganizationCard from '@/components/organizationCard/OrganizationCard'
import { environmentsWithChecklist } from '@/constants/environments'
import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { getAllowedStudyIdByAccount } from '@/db/study'
import EnvironmentInitializer from '@/environments/core/EnvironmentInitializer'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { getEnvironment } from '@/i18n/environment'
import { Box } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user: account }: Props & UserSessionProps) => {
  const environment = await getEnvironment()
  if (account.needsAccountSelection) {
    return (
      <main className={classNames(styles.content, { [styles.withOrganizationCard]: account.organizationVersionId })}>
        {children}
      </main>
    )
  }

  const [organizationVersions, studyId] = await Promise.all([
    getAccountOrganizationVersions(account.accountId),
    getAllowedStudyIdByAccount(account),
  ])

  const shouldDisplayOrgaCard =
    organizationVersions.find((org) => org.isCR || org.parentId) && account.environment !== Environment.CUT

  const accountOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const clientId = organizationVersions.find(
    (organizationVersion) => organizationVersion.id !== account.organizationVersionId,
  )?.id

  return (
    <DynamicTheme environment={environment}>
      <Box className="flex-col h100">
        <Navbar user={account} environment={environment} />
        {shouldDisplayOrgaCard && (
          <OrganizationCard
            account={account}
            organizationVersions={organizationVersions as OrganizationVersionWithOrganization[]}
          />
        )}
        <Box
          component="main"
          className={classNames(styles.content, { [styles.withOrganizationCard]: shouldDisplayOrgaCard })}
        >
          {children}
        </Box>
        {accountOrganizationVersion && environmentsWithChecklist.includes(accountOrganizationVersion.environment) && (
          <ChecklistButton
            accountOrganizationVersion={accountOrganizationVersion}
            clientId={clientId}
            studyId={studyId}
            userRole={account.role}
          />
        )}
        <EnvironmentInitializer user={account} />
      </Box>
    </DynamicTheme>
  )
}

export default withAuth(NavLayout)
