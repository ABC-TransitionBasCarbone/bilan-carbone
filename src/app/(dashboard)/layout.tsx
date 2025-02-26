import withAuth, { UserProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import OrganizationCard from '@/components/organizationCard/OrganizationCard'
import { getUserOrganizations } from '@/db/user'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user }: Props & UserProps) => {
  const organizations = await getUserOrganizations(user.email)
  return (
    <div className="flex-col h100">
      <Navbar user={user} />
      {user.organizationId && <OrganizationCard user={user} organizations={organizations} />}
      <main className={classNames(styles.content, { [styles.withOrganizationCard]: user.organizationId })}>
        {children}
      </main>
    </div>
  )
}

export default withAuth(NavLayout)
