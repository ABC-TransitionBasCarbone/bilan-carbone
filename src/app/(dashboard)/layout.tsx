import ChecklistButton from '@/components/checklist/ChecklistButton'
import withAuth, { UserProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import OrganizationCard from '@/components/organizationCard/OrganizationCard'
import { getAllowedStudyIdByUser } from '@/db/study'
import { getUserOrganizations } from '@/db/user'
import { Organization } from '@prisma/client'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user }: Props & UserProps) => {
  const [organizations, studyId] = await Promise.all([getUserOrganizations(user.email), getAllowedStudyIdByUser(user)])
  const userOrganization = organizations.find((organization) => organization.id === user.organizationId) as Organization
  const clientId = organizations.find((organization) => organization.id !== user.organizationId)?.id

  return (
    <div className="flex-col h100">
      <Navbar user={user} />
      {user.organizationId && <OrganizationCard user={user} organizations={organizations} />}
      <main className={classNames(styles.content, { [styles.withOrganizationCard]: user.organizationId })}>
        {children}
      </main>
      {userOrganization && (
        <ChecklistButton
          userOrganization={userOrganization}
          clientId={clientId}
          studyId={studyId}
          userRole={user.role}
        />
      )}
    </div>
  )
}

export default withAuth(NavLayout)
