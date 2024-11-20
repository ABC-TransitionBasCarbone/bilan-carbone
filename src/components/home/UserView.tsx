import { Suspense } from 'react'
import classNames from 'classnames'
import { User } from 'next-auth'
import styles from './styles.module.css'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'
import { getUserOrganizations } from '@/db/user'
import Actualities from '../actuality/Actualities'
import Organizations from '../organization/OrganizationsContainer'
import Studies from '../study/StudiesContainer'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const organizations = await getUserOrganizations(user.email)
  const isCR = organizations.find((organization) => organization.id === user.organizationId)?.isCR

  return (
    <div className="flex-col">
      <Suspense>
        <ResultsContainerForUser user={user} />
      </Suspense>
      <div className={classNames(styles.container, 'w100')}>
        <Actualities />
        {isCR ? <Organizations organizations={organizations} /> : <Studies user={user} />}
      </div>
    </div>
  )
}

export default UserView
