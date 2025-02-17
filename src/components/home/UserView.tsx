import { getUserOrganizations, hasUserToValidateInOrganization } from '@/db/user'
import { isAdmin } from '@/services/permissions/user'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import Actualities from '../actuality/ActualitiesCards'
import Block from '../base/Block'
import Onboarding from '../onboarding/Onboarding'
import Studies from '../study/StudiesContainer'
import CRClientsList from './CRClientsList'
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
      {isCR ? (
        <CRClientsList
          organizations={organizations.filter((organization) => organization.id !== user.organizationId)}
        />
      ) : null}
      {/* {user.organizationId && (
        <Suspense>
          <ResultsContainerForUser user={user} mainStudyOrganizationId={user.organizationId} />
        </Suspense>
      )} */}
      <Actualities />
      <Block>{isCR ? null : <Studies user={user} />}</Block>
      {userOrganization && !userOrganization.onboarded && <Onboarding user={user} organization={userOrganization} />}
    </>
  )
}

export default UserView
