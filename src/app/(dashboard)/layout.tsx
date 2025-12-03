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

const renewalMessageStartMonth = Number(process.env.NEXT_LICENSE_RENEWAL_MONTH) || 13 // 13 is never to be displayed if variable is not defined

const NavLayout = async ({ children, user: account }: Props & UserSessionProps) => {
  const environment = await getEnvironment()
  if (account.needsAccountSelection) {
    return <main className={styles.content}>{children}</main>
  }

  const currentDate = new Date()

  const [organizationVersions, studyId] = await Promise.all([
    getAccountOrganizationVersions(account.accountId),
    getAllowedStudyIdByAccount(account),
  ])

  const accountOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const clientId = organizationVersions.find(
    (organizationVersion) => organizationVersion.id !== account.organizationVersionId,
  )?.id

  const shouldDisplayOrgaData =
    !!organizationVersions.find((org) => org.isCR || org.parentId) && account.environment !== Environment.CUT
  const shouldRenewLicense =
    accountOrganizationVersion &&
    accountOrganizationVersion.environment === Environment.BC &&
    !accountOrganizationVersion.activatedLicence.includes(currentDate.getFullYear() + 1) &&
    currentDate.getMonth() + 1 >= renewalMessageStartMonth // month + 1 is to use "human" month : january is 1, december is 12

  const withOrganizationCard = shouldDisplayOrgaData || shouldRenewLicense

  return (
    <DynamicTheme environment={environment}>
      <Box className={classNames('flex-col h100', { [styles.withOrganizationCard]: withOrganizationCard })}>
        <Navbar user={account} environment={environment} />
        {withOrganizationCard && (
          <OrganizationCard
            account={account}
            organizationVersions={organizationVersions as OrganizationVersionWithOrganization[]}
            shouldDisplayOrgaData={shouldDisplayOrgaData}
            shouldRenewLicense={shouldRenewLicense}
          />
        )}
        <Box component="main" className={styles.content}>
          {children}
        </Box>
        {accountOrganizationVersion && environmentsWithChecklist.includes(accountOrganizationVersion.environment) && (
          <ChecklistButton
            accountOrganizationVersion={accountOrganizationVersion}
            clientId={clientId}
            studyId={studyId}
            userRole={account.role}
            userLevel={account.level}
          />
        )}
        <EnvironmentInitializer user={account} />
      </Box>
    </DynamicTheme>
  )
}

export default withAuth(NavLayout)
