import { Role, User, UserStatus } from '@prisma/client'
import { OnboardingCommand } from '../services/serverFunctions/user.command'
import { sendNewUser } from '../services/serverFunctions/userAuth'
import { prismaClient } from './client'

export const onboardOrganization = async (
  userId: string,
  { organizationId, companyName, firstName, lastName, collaborators = [] }: OnboardingCommand,
  existingCollaborators: User[],
) => {
  const dbUser = await prismaClient.user.findUnique({ where: { id: userId } })
  if (!dbUser) {
    return
  }
  const role = dbUser.level ? Role.ADMIN : Role.GESTIONNAIRE
  const newCollaborators: Pick<User, 'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'organizationId'>[] = []
  for (const collaborator of collaborators) {
    newCollaborators.push({
      firstName: '',
      lastName: '',
      email: collaborator.email || '',
      role: collaborator.role === Role.ADMIN ? Role.GESTIONNAIRE : (collaborator.role ?? Role.COLLABORATOR),
      status: UserStatus.VALIDATED,
      organizationId,
    })
  }

  await prismaClient.$transaction(async (transaction) => {
    await Promise.all([
      transaction.organization.update({
        where: { id: organizationId },
        data: { name: companyName },
      }),
      transaction.user.update({
        where: { id: userId },
        data: { firstName, lastName, role },
      }),
      transaction.user.createMany({ data: newCollaborators }),
      ...existingCollaborators.map((collaborator) =>
        transaction.user.update({
          where: { id: collaborator.id },
          data: {
            role:
              collaborator.level || collaborator.role !== Role.ADMIN
                ? collaborator.role
                : collaborator.role === Role.ADMIN
                  ? Role.GESTIONNAIRE
                  : Role.COLLABORATOR,
            status: UserStatus.VALIDATED,
          },
        }),
      ),
    ])
  })

  const allCollaborators = [...newCollaborators, ...existingCollaborators]
  allCollaborators.forEach((collab) => sendNewUser(collab.email, dbUser, collab.firstName ?? ''))
}
