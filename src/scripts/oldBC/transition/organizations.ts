import { Prisma } from '@prisma/client'
import { prismaClient } from '../../../db/client'

const getOrganizationId = (id: string, oldUserOrganizationId: string, userOrganizationId: string) => {
  // Si l'id que je recherche est l'ancienne id principale, je la remplace par le nouveau
  if (id === oldUserOrganizationId) {
    return userOrganizationId
  }
  return id
}

export const uploadOrganizations = async (
  transaction: Prisma.TransactionClient,
  data: (string | number)[][],
  indexes: Record<string, number>,
  userOrganizationId: string,
) => {
  console.log('Import des organisations...')
  const organizations = data
    .slice(1)
    .map((row) => ({
      id: row[indexes['ID_ENTITE']],
      name: row[indexes['NOM_ORGANISATION']],
      entityName: row[indexes['NOM_ENTITE']],
      mainEntity: row[indexes['ENTITE_PRINCIPALE']],
      siret: row[indexes['SIRET']],
      parentId: row[indexes['ID_ENTITE_MERE']],
      userOrga: row[indexes['IS_USER_ORGA']],
    }))
    // On ignore les parentID supprimés
    .filter((organization) => organization.parentId !== '00000000-0000-0000-0000-000000000000')

  const existingOrganizations = await prismaClient.organization.findMany({
    where: {
      OR: [
        // On va chercher les ids déjà importé
        { id: { in: organizations.map((organization) => organization.id as string) } },
        // Ou les siret deja existant
        { siret: { in: organizations.map((organization) => organization.siret as string).filter((siret) => siret) } },
        // Ou si il n'y a pas de siret, les organisations avec le même nom, dans mon organisation
        {
          parentId: userOrganizationId,
          name: {
            in: organizations
              .filter((organization) => !organization.siret)
              .map((organization) => organization.name as string),
          },
        },
      ],
    },
  })

  const oldUserOrganizationId = organizations.find((organization) => organization.userOrga === 1)?.id as string
  const newOrganizations = organizations
    .filter(
      (organization) =>
        // On ne crée pas les organizations avec un id déjà existant
        // Ou avec un siret existant
        // Ou si il n'y a pas de siret, avec un nom existant dans mon organisation
        !existingOrganizations.some(
          ({ id, siret, name }) =>
            id === organization.id || (organization.siret ? siret === organization.siret : name === organization.name),
        ),
    )
    .filter((organization) => organization.mainEntity === 1)

  // Je crée toutes les organisations sauf la mienne
  const organizationsToCreate = newOrganizations.filter((organization) => organization.userOrga !== 1)
  if (organizationsToCreate.length > 0) {
    console.log(`Import de ${organizationsToCreate.length} organisations`)
    await transaction.organization.createMany({
      data: organizationsToCreate.map((organization) => ({
        parentId: userOrganizationId,
        id: organization.id as string,
        siret: organization.siret as string,
        name: organization.name as string,
        isCR: false,
        importedFileDate: new Date(),
      })),
    })
  }

  if (newOrganizations.length > 0) {
    console.log(`Ajout de ${newOrganizations.length} sites par défaut`)
    // Et pour toutes les organisations j'ajoute un site par defaut
    await transaction.site.createMany({
      data: newOrganizations.map((organization) => ({
        organizationId: getOrganizationId(organization.id as string, oldUserOrganizationId, userOrganizationId),
        name: organization.entityName as string,
      })),
    })
  }

  // Et je crée tous les autres sites
  const sitesToCreate = organizations
    .filter((organization) => organization.mainEntity !== 1)
    .map((organization) => ({
      organizationId: getOrganizationId(organization.parentId as string, oldUserOrganizationId, userOrganizationId),
      name: organization.entityName as string,
    }))
    // Sauf celles qui n'ont pas de parent (car supprimées dans l'ancien BC+)
    .filter((site) => organizationsToCreate.some((organization) => organization.id === site.organizationId))
    .filter((site) => site.organizationId !== userOrganizationId)
  if (sitesToCreate.length > 0) {
    console.log(`Import de ${sitesToCreate.length} sites`)
    await transaction.site.createMany({ data: sitesToCreate })
  }

  if (existingOrganizations.length > 0) {
    console.log(`${existingOrganizations.length} organisations ignorées car déjà existantes`)
  }
  return existingOrganizations.length > 0
}
