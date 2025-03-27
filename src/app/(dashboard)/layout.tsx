// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import ChecklistButton from '@/components/checklist/ChecklistButton'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import OrganizationCard from '@/components/organizationCard/OrganizationCard'
import { getAccountOrganizations } from '@/db/account'
import { getAllowedStudyIdByAccount } from '@/db/study'
import { Organization } from '@prisma/client'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user: account }: Props & UserSessionProps) => {
  const [organizations, studyId] = await Promise.all([
    getAccountOrganizations(account.accountId),
    getAllowedStudyIdByAccount(account),
  ])

  const userOrganization = organizations.find(
    (organization) => organization.id === account.organizationId,
  ) as Organization
  const clientId = organizations.find((organization) => organization.id !== account.organizationId)?.id

  return (
    <div className="flex-col h100">
      <Navbar account={account} />
      {account.organizationId && <OrganizationCard account={account} organizations={organizations} />}
      <main className={classNames(styles.content, { [styles.withOrganizationCard]: account.organizationId })}>
        {children}
      </main>
      <ChecklistButton
        userOrganization={userOrganization}
        clientId={clientId}
        studyId={studyId}
        userRole={account.role}
      />
    </div>
  )
}

export default withAuth(NavLayout)
