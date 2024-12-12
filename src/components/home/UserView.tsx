import { getUserOrganizations } from '@/db/user'
import { User } from 'next-auth'
import { Suspense } from 'react'
import Actualities from '../actuality/Actualities'
import Block from '../base/Block'
import Organizations from '../organization/OrganizationsContainer'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'
import Studies from '../study/StudiesContainer'
import styles from './UserView.module.css'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const organizations = await getUserOrganizations(user.email)
  const isCR = organizations.find((organization) => organization.id === user.organizationId)?.isCR

  return (
    <>
      {user.organizationId && (
        <Suspense>
          <Block>
            <ResultsContainerForUser user={user} mainStudyOrganizationId={user.organizationId} />
          </Block>
        </Suspense>
      )}
      <Block>
        <div className={styles.container}>
          <Actualities />
          {isCR ? <Organizations organizations={organizations} /> : <Studies user={user} />}
        </div>
      </Block>
    </>
  )
}

export default UserView
