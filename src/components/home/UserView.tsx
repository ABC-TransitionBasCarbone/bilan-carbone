import { getUserOrganizations, hasUserToValidateInOrganization } from '@/db/user'
import { isAdmin } from '@/services/permissions/user'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { Suspense } from 'react'
import Actualities from '../actuality/ActualitiesCards'
import Block from '../base/Block'
import Onboarding from '../onboarding/Onboarding'
import Organizations from '../organization/OrganizationsContainer'
import ResultsContainerForUser from '../study/results/ResultsContainerForUser'
import Studies from '../study/StudiesContainer'
import UserToValidate from './UserToValidate'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const [organizations, hasUserToValidate] = await Promise.all([
    getUserOrganizations(user.email),
    hasUserToValidateInOrganization(user.organizationId),
  ])

  const userOrganization = organizations.find((organization) => organization.id === user.organizationId)
  const isCR = userOrganization?.isCR

  return (
    <>
      {!!hasUserToValidate && (isAdmin(user.role) || user.role === Role.GESTIONNAIRE) && (
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
        <Actualities />
      </Block>
      <Block>{isCR ? <Organizations organizations={organizations} /> : <Studies user={user} />}</Block>
      {userOrganization && !userOrganization.onboarded && <Onboarding user={user} organization={userOrganization} />}
    </>
  )
}

export default UserView
