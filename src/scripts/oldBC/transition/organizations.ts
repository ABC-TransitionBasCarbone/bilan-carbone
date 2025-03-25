import { Prisma } from '@prisma/client'
import { prismaClient } from '../../../db/client'

export enum RequiredOrganizationsColumns {
  ID_ENTITE = 'ID_ENTITE',
  NOM_ORGANISATION = 'NOM_ORGANISATION',
  NOM_ENTITE = 'NOM_ENTITE',
  ENTITE_PRINCIPALE = 'ENTITE_PRINCIPALE',
  SIRET = 'SIRET',
  ID_ENTITE_MERE = 'ID_ENTITE_MERE',
  IS_USER_ORGA = 'IS_USER_ORGA',
}

const getCreatedOrganizationsIds = async (
  transaction: Prisma.TransactionClient,
  organizations: {
    oldBCId: string | number
    name: string | number
    entityName: string | number
    mainEntity: string | number
    siret: string | number
    parentId: string | number
    userOrga: string | number
  }[],
  userOrganizationId: string,
) => {
  const createdOrganizations = await transaction.organization.findMany({
    where: {
      oldBCId: {
        in: organizations.map((organization) => organization.oldBCId as string),
      },
    },
    select: { id: true, oldBCId: true },
  })

  const createdOrganizationsMap = createdOrganizations.reduce((map, currentCreatedOrganisation) => {
    if (currentCreatedOrganisation.oldBCId) {
      map.set(currentCreatedOrganisation.oldBCId, currentCreatedOrganisation.id)
    }
    return map
  }, new Map<string, string>())

  const userOrganizationOldBCId = organizations.find((organization) => organization.userOrga === 1)?.oldBCId as string
  createdOrganizationsMap.set(userOrganizationOldBCId, userOrganizationId)

  return createdOrganizationsMap
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
      oldBCId: row[indexes[RequiredOrganizationsColumns.ID_ENTITE]],
      name: row[indexes[RequiredOrganizationsColumns.NOM_ORGANISATION]],
      entityName: row[indexes[RequiredOrganizationsColumns.NOM_ENTITE]],
      mainEntity: row[indexes[RequiredOrganizationsColumns.ENTITE_PRINCIPALE]],
      siret: row[indexes[RequiredOrganizationsColumns.SIRET]],
      parentId: row[indexes[RequiredOrganizationsColumns.ID_ENTITE_MERE]],
      userOrga: row[indexes[RequiredOrganizationsColumns.IS_USER_ORGA]],
    }))
    // On ignore les parentID supprimés
    .filter((organization) => organization.parentId !== '00000000-0000-0000-0000-000000000000')

  const existingOrganizations = await prismaClient.organization.findMany({
    where: {
      OR: [
        // On va chercher les ids déjà importé
        { oldBCId: { in: organizations.map((organization) => organization.oldBCId as string) } },
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

  const newOrganizations = organizations
    .filter(
      (organization) =>
        // On ne crée pas les organizations avec un id déjà existant
        // Ou avec un siret existant
        // Ou si il n'y a pas de siret, avec un nom existant dans mon organisation
        !existingOrganizations.some(
          ({ oldBCId, siret, name }) =>
            oldBCId === organization.oldBCId ||
            (organization.siret ? siret === organization.siret : name === organization.name),
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
        oldBCId: organization.oldBCId as string,
        siret: organization.siret as string,
        name: organization.name as string,
        isCR: false,
        activatedLicence: true,
      })),
    })
  }

  const createdOrganizationsIds = await getCreatedOrganizationsIds(transaction, organizations, userOrganizationId)

  if (newOrganizations.length > 0) {
    console.log(`Ajout de ${newOrganizations.length} sites par défaut`)
    // Et pour toutes les organisations j'ajoute un site par defaut
    await transaction.site.createMany({
      data: newOrganizations
        .map((organization) => {
          const createdOrganisationId = createdOrganizationsIds.get(organization.oldBCId as string)
          if (!createdOrganisationId) {
            console.warn(`Impossible de retrouver l'organization avec l'ancien BC id ${organization.oldBCId}`)
            return null
          }
          return {
            oldBCId: organization.oldBCId as string,
            organizationId: createdOrganisationId,
            name: organization.entityName as string,
          }
        })
        .filter((organization) => organization !== null),
    })
  }

  // Et je crée tous les autres sites
  const sitesToCreate = organizations
    .filter((organization) => organization.mainEntity !== 1)
    .map((organization) => {
      const createdParentOrganisationId = createdOrganizationsIds.get(organization.parentId as string)
      if (!createdParentOrganisationId) {
        console.warn(`Impossible de retrouver l'organization avec le parent id ${organization.parentId}`)
        return null
      }
      return {
        oldBCId: organization.oldBCId as string,
        organizationId: createdParentOrganisationId,
        name: organization.entityName as string,
      }
    })
    .filter((site) => site !== null)
    // Sauf celles qui n'ont pas de parent (car supprimées dans l'ancien BC+)
    .filter((site) => organizationsToCreate.some((organization) => organization.oldBCId === site.organizationId))
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
