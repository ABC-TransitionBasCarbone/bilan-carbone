import { OrganizationVersionWithOrganization, OrganizationVersionWithOrganizationSelect } from '@/db/organization'
import { Environment, Prisma } from '@prisma/client'
import { OrganizationRow, OrganizationsWorkSheet } from './oldBCWorkSheetsReader'
import { getExistingSitesIds } from './repositories'

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

function mapRowToOrganization(row: OrganizationRow) {
  return {
    oldBCId: row.ID_ENTITE as string,
    name: row.NOM_ORGANISATION as string,
    siret: row.SIRET as string,
  }
}

function mapRowToSite(row: OrganizationRow) {
  return {
    oldBCId: row.ID_ENTITE as string,
    name: row.NOM_ENTITE as string,
    organizationOldBCId: row.ID_ENTITE_MERE as string,
  }
}

async function checkUserOrganizationHaveNoNewSites(transaction: Prisma.TransactionClient, userOrganizationId: string) {
  const numberOfNewUserOrganizationSites = await transaction.site.count({
    where: {
      AND: [{ organizationId: userOrganizationId }, { oldBCId: null }],
    },
  })
  if (numberOfNewUserOrganizationSites > 0) {
    throw new Error(`L'organisation de l'utilisateur contient ${numberOfNewUserOrganizationSites} nouveau(x) site(s).`)
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
  organizationWorksheet: OrganizationsWorkSheet,
  userOrganizationVersion: OrganizationVersionWithOrganization,
) => {
  console.log('Import des organisations...')

  const userOrganizationsRows: { oldBCId: string; name: string }[] = []
  const organizations: Organization[] = []
  const sites: Site[] = []
  organizationWorksheet
    .getRows()
    // On ignore les parentID supprimés
    .filter((row) => (row.ID_ENTITE_MERE as string) !== '00000000-0000-0000-0000-000000000000')
    .forEach((row) => {
      if ((row.IS_USER_ORGA as number) === 1) {
        userOrganizationsRows.push({
          oldBCId: row.ID_ENTITE as string,
          name: row.NOM_ENTITE as string,
        })
      } else if (row.ID_ENTITE === row.ID_ENTITE_MERE) {
        organizations.push(mapRowToOrganization(row))
      } else {
        sites.push(mapRowToSite(row))
      }
    })

  if (userOrganizationsRows.length !== 1) {
    throw new Error("Il faut exactement 1 organisation rattachée à l'utilisateur !")
  }
  const userOrganizationRow = userOrganizationsRows[0]

  await checkUserOrganizationHaveNoNewSites(transaction, userOrganizationVersion.organizationId)

  const existingOrganizationVersions = await transaction.organizationVersion.findMany({
    where: {
      AND: [
        { parentId: userOrganizationVersion.id },
        { organization: { oldBCId: { in: organizations.map((organization) => organization.oldBCId) } } },
      ],
    },
    select: OrganizationVersionWithOrganizationSelect,
  })

  const newOrganizations = organizations.filter(
    (organization) =>
      !existingOrganizationVersions.some(
        ({ organization: existingOrganization }) => existingOrganization.oldBCId === organization.oldBCId,
      ),
  )

  // Je crée un site par défaut pour mon organization
  await transaction.site.create({
    data: {
      oldBCId: userOrganizationRow.oldBCId,
      organizationId: userOrganizationVersion.organizationId,
      name: userOrganizationRow.name,
    },
  })

  // Je crée toutes les organisations sauf la mienne
  if (newOrganizations.length > 0) {
    console.log(`Import de ${newOrganizations.length} organisations`)
    const createdOrganizations = await transaction.organization.createManyAndReturn({
      data: newOrganizations.map((organization) => ({
        oldBCId: organization.oldBCId,
        name: organization.name,
      })),
    })
    await transaction.organizationVersion.createMany({
      data: newOrganizations
        .map((organization) => {
          const foundCreatedOrganization = createdOrganizations.find(
            (createdOrganization) => createdOrganization.oldBCId === organization.oldBCId,
          )
          if (!foundCreatedOrganization) {
            return null
          }
          return {
            environment: Environment.BC,
            organizationId: foundCreatedOrganization.id,
            parentId: userOrganizationVersion.id,
          }
        })
        .filter((organizationVersion) => organizationVersion !== null),
    })
  }

  const organizationsOldBCIdsIdsMap = await getOrganizationsOldBCIdsIdsMap(
    transaction,
    organizations,
    userOrganizationVersion.organizationId,
    userOrganizationRow.oldBCId,
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

  const existingSitesIds = await getExistingSitesIds(
    transaction,
    sites.map((site) => site.oldBCId),
  )
  // Et je crée tous les autres sites
  const sitesToCreate = sites
    .filter((site) => !existingSitesIds.has(site.oldBCId))
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
  if (sitesToCreate.length > 0) {
    console.log(`Import de ${sitesToCreate.length} sites`)
    await transaction.site.createMany({ data: sitesToCreate })
  }

  if (existingOrganizationVersions.length > 0) {
    console.log(`${existingOrganizationVersions.length} organisations ignorées car déjà existantes`)
  }
  return existingOrganizationVersions.length > 0
}
