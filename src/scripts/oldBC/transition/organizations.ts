import { Prisma } from '@prisma/client'
import { prismaClient } from '../../../db/client'

export enum RequiredOrganizationsColumns {
  ID_ENTITE = 'ID_ENTITE',
  NOM_ORGANISATION = 'NOM_ORGANISATION',
  NOM_ENTITE = 'NOM_ENTITE',
  SIRET = 'SIRET',
  ID_ENTITE_MERE = 'ID_ENTITE_MERE',
  IS_USER_ORGA = 'IS_USER_ORGA',
}

interface Organization {
  oldBCId: string
  name: string
  siret: string
}

interface Site {
  oldBCId: string
  name: string
  organizationOldBCId: string
}

function mapRowToOrganization(row: (string | number)[], indexes: Record<string, number>) {
  return {
    oldBCId: row[indexes[RequiredOrganizationsColumns.ID_ENTITE]] as string,
    name: row[indexes[RequiredOrganizationsColumns.NOM_ORGANISATION]] as string,
    siret: row[indexes[RequiredOrganizationsColumns.SIRET]] as string,
  }
}

function mapRowToSite(row: (string | number)[], indexes: Record<string, number>) {
  return {
    oldBCId: row[indexes[RequiredOrganizationsColumns.ID_ENTITE]] as string,
    name: row[indexes[RequiredOrganizationsColumns.NOM_ENTITE]] as string,
    organizationOldBCId: row[indexes[RequiredOrganizationsColumns.ID_ENTITE_MERE]] as string,
  }
}

const getOrganizationsOldBCIdsIdsMap = async (
  transaction: Prisma.TransactionClient,
  organizations: Organization[],
  userOrganizationId: string,
  userOrganizationOldBCId: string,
) => {
  const createdOrganizations = await transaction.organization.findMany({
    where: {
      oldBCId: {
        in: organizations.map((organization) => organization.oldBCId),
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

  const userOrganizationsOldBCIds: string[] = []
  const organizations: Organization[] = []
  const sites: Site[] = []
  data
    .slice(1)
    // On ignore les parentID supprimés
    .filter(
      (row) =>
        (row[indexes[RequiredOrganizationsColumns.ID_ENTITE_MERE]] as string) !==
        '00000000-0000-0000-0000-000000000000',
    )
    .forEach((row) => {
      if ((row[indexes[RequiredOrganizationsColumns.IS_USER_ORGA]] as number) === 1) {
        userOrganizationsOldBCIds.push(row[indexes[RequiredOrganizationsColumns.ID_ENTITE]] as string)
      } else if (
        row[indexes[RequiredOrganizationsColumns.ID_ENTITE]] ===
        row[indexes[RequiredOrganizationsColumns.ID_ENTITE_MERE]]
      ) {
        organizations.push(mapRowToOrganization(row, indexes))
      } else {
        sites.push(mapRowToSite(row, indexes))
      }
    })

  if (userOrganizationsOldBCIds.length !== 1) {
    throw new Error("Il faut exactement 1 organisation rattachée à l'utilisateur !")
  }
  const userOrganizationOldBCId = userOrganizationsOldBCIds[0]

  const existingOrganizations = await prismaClient.organization.findMany({
    where: {
      AND: [
        { parentId: userOrganizationId },
        { oldBCId: { in: organizations.map((organization) => organization.oldBCId) } },
      ],
    },
  })

  const newOrganizations = organizations.filter(
    (organization) => !existingOrganizations.some(({ oldBCId }) => oldBCId === organization.oldBCId),
  )

  // Je crée toutes les organisations sauf la mienne
  if (newOrganizations.length > 0) {
    console.log(`Import de ${newOrganizations.length} organisations`)
    await transaction.organization.createMany({
      data: newOrganizations.map((organization) => ({
        parentId: userOrganizationId,
        oldBCId: organization.oldBCId,
        siret: organization.siret,
        name: organization.name,
        isCR: false,
        activatedLicence: false,
      })),
    })
  }

  const organizationsOldBCIdsIdsMap = await getOrganizationsOldBCIdsIdsMap(
    transaction,
    organizations,
    userOrganizationId,
    userOrganizationOldBCId,
  )

  if (newOrganizations.length > 0) {
    console.log(`Ajout de ${newOrganizations.length} sites par défaut`)
    // Et pour toutes les organisations j'ajoute un site par defaut
    await transaction.site.createMany({
      data: newOrganizations
        .map((organization) => {
          const createdOrganisationId = organizationsOldBCIdsIdsMap.get(organization.oldBCId)
          if (!createdOrganisationId) {
            console.warn(`Impossible de retrouver l'organization avec l'ancien BC id ${organization.oldBCId}`)
            return null
          }
          return {
            oldBCId: organization.oldBCId,
            organizationId: createdOrganisationId,
            name: organization.name,
          }
        })
        .filter((organization) => organization !== null),
    })
  }

  // Et je crée tous les autres sites
  const sitesToCreate = sites
    .filter(
      (site) =>
        !existingOrganizations.some(
          (existingOrganization) => existingOrganization.oldBCId === site.organizationOldBCId,
        ),
    )
    .map((site) => {
      const existingParentOrganisationId = organizationsOldBCIdsIdsMap.get(site.organizationOldBCId)
      if (!existingParentOrganisationId) {
        console.warn(`Impossible de retrouver l'organization avec le oldBCId ${site.organizationOldBCId}`)
        return null
      }
      return {
        oldBCId: site.oldBCId,
        organizationId: existingParentOrganisationId,
        name: site.name,
      }
    })
    .filter((site) => site !== null)
    // Sauf celles qui n'ont pas de parent (car supprimées dans l'ancien BC+)
    .filter((site) => newOrganizations.some((organization) => organization.oldBCId === site.organizationId))
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
