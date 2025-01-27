import { getUserOrganizations, hasUserToValidateInOrganization } from '@/db/user'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { Suspense } from 'react'
import Actualities from '../actuality/Actualities'
import Block from '../base/Block'
import Onboarding from '../onboarding/Onboarding'
import Organizations from '../organization/OrganizationsContainer'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'
import Studies from '../study/StudiesContainer'
import UserToValidate from './UserToValidate'
import styles from './UserView.module.css'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const [organizations, hasUserToValidate] = await Promise.all([
    getUserOrganizations(user.email),
    hasUserToValidateInOrganization(user.organizationId),
  ])
  const isCR = organizations.find((organization) => organization.id === user.organizationId)?.isCR
  return (
    <>
      {!!hasUserToValidate && (user.role === Role.ADMIN || user.role === Role.GESTIONNAIRE) && (
        <div className="main-container">
          <UserToValidate />
        </div>
      )}
      {user.organizationId && (
        <Suspense>
          <ResultsContainerForUser user={user} mainStudyOrganizationId={user.organizationId} />
        </Suspense>
      )}
      <Block>
        <div className={styles.container}>
          <Actualities />
          {isCR ? <Organizations organizations={organizations} /> : <Studies user={user} />}
        </div>
      </Block>
      <Onboarding organization={organizations[0]} />
    </>
  )
}

export default UserView
