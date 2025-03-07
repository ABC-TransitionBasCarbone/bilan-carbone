import withAuth, { UserProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import OrganizationCard from '@/components/organizationCard/OrganizationCard'
import { getAllowedStudyIdByUser } from '@/db/study'
import { getUserOrganizations } from '@/db/user'
import { getUserChecklist } from '@/services/serverFunctions/user'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user }: Props & UserProps) => {
  const [organizations, userChecklist, studyId] = await Promise.all([
    getUserOrganizations(user.email),
    getUserChecklist(),
    getAllowedStudyIdByUser(user),
  ])

  return (
    <div className="flex-col h100">
      <Navbar user={user} userChecklist={userChecklist} organizations={organizations} studyId={studyId} />
      {user.organizationId && <OrganizationCard user={user} organizations={organizations} />}
      <main className={classNames(styles.content, { [styles.withOrganizationCard]: user.organizationId })}>
        {children}
      </main>
    </div>
  )
}

export default withAuth(NavLayout)
