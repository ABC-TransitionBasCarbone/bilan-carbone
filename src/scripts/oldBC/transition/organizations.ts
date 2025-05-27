import { OrganizationVersionWithOrganization, OrganizationVersionWithOrganizationSelect } from '@/db/organization'
import { Environment, Prisma } from '@prisma/client'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
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

interface BddSite {
  id: string
  oldBCId: string | null
  name: string
  organizationId: string
  etp: number
  ca: number
  postalCode: string | null
  city: string | null
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

function compareString(a: string, b: string): boolean {
  return a.toLocaleLowerCase().trim() === b.toLocaleLowerCase().trim()
}

async function handleUserOrganizationSites(
  existingSites: BddSite[],
  oldBCOrganizationSites: Site[],
  skipCheck: boolean = false,
) {
  if (oldBCOrganizationSites.length === 0) {
    return { sitesToUpdate: [], sitesToCreate: [] }
  }

  const sitesToCreate: Site[] = []
  const sitesToUpdate: { id: string; oldBCId: string; name: string }[] = []

  if (existingSites.length > 0) {
    console.log("L'organisation de l’utilisateur a déjà des sites, on trouve la correspondance")
    for (const oldBCSite of oldBCOrganizationSites) {
      const site = existingSites.find((s) => compareString(s.name, oldBCSite.name))
      if (site) {
        sitesToUpdate.push({ id: site.id, oldBCId: oldBCSite.oldBCId, name: site.name })
      } else {
        sitesToCreate.push(oldBCSite)
      }
    }
  }

  if (!skipCheck && sitesToUpdate.length + sitesToCreate.length < existingSites.length) {
    const rl = readline.createInterface({ input, output })

    const doWeContinue = await rl.question(
      `Il y a des sites sur le BC+ qui n'ont pas de correspondances dans l'ancien : 
          NEW : ${existingSites.map((s) => s.name).join(', ')} 
          OLD : ${oldBCOrganizationSites.map((s) => s.name).join(', ')}
          Ceux qui correspondent : ${sitesToUpdate.map((s) => s.name).join(', ')}
          Sites qui vont être créé : ${sitesToCreate.map((s) => s.name).join(', ')}
          
          Est-ce qu'on continue ? (oui/non) `,
    )

    if (doWeContinue?.toLocaleLowerCase() !== 'oui') {
      throw new Error(
        `On arrête le programme pour éviter de créer des sites en doublon. Mettre à jour les sites sur l'une des deux plateformes (BC+ ou OldBC+).`,
      )
    } else {
      console.log('On ignore les sites qui n’ont pas de correspondance')
    }

    rl.close()
  }

  return { sitesToUpdate, sitesToCreate }
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

export const checkOrganization = async (
  organizationWorksheet: OrganizationsWorkSheet,
  userOrganizationVersion: OrganizationVersionWithOrganization,
  transactionOrPrisma: Prisma.TransactionClient,
  skipCheck = false,
) => {
  const userOrganizationsRows: { oldBCId: string; name: string }[] = []
  const userOrganizationsSites: Site[] = []
  const organizations: Organization[] = []
  const sites: Site[] = []
  organizationWorksheet
    .getRows()
    // On ignore les parentID supprimés
    .filter((row) => (row.ID_ENTITE_MERE as string) !== '00000000-0000-0000-0000-000000000000')
    .forEach((row) => {
      if ((row.IS_USER_ORGA as number) === 1 && row.ID_ENTITE_MERE === row.ID_ENTITE) {
        userOrganizationsRows.push({
          oldBCId: row.ID_ENTITE as string,
          name: row.NOM_ENTITE as string,
        })
        userOrganizationsSites.push(mapRowToSite(row))
      } else if (row.IS_USER_ORGA === 1 && row.ID_ENTITE_MERE !== row.ID_ENTITE) {
        userOrganizationsSites.push(mapRowToSite(row))
      } else if (row.ID_ENTITE === row.ID_ENTITE_MERE) {
        organizations.push(mapRowToOrganization(row))
      } else {
        sites.push(mapRowToSite(row))
      }
    })

  if (!userOrganizationVersion.isCR && organizations.length > 0) {
    throw new Error("L'utilisateur n'est pas une organisation CR, il ne peut pas importer d'autres organisations.")
  }

  if (userOrganizationsRows.length !== 1) {
    throw new Error("Il faut exactement 1 organisation rattachée à l'utilisateur !")
  }
  const userOrganizationRow = userOrganizationsRows[0]

  let existingSites: BddSite[] = []
  existingSites = await transactionOrPrisma.site.findMany({
    where: {
      AND: [{ organizationId: userOrganizationVersion.organizationId }, { oldBCId: null }],
    },
  })

  const userOrgaSites = await handleUserOrganizationSites(existingSites, userOrganizationsSites, skipCheck)

  return {
    organizations,
    userOrganizationRow,
    userOrganizationVersion,
    sites,
    userOrgaSites,
  }
}

export const uploadOrganizations = async (
  transaction: Prisma.TransactionClient,
  organizationWorksheet: OrganizationsWorkSheet,
  userOrganizationVersion: OrganizationVersionWithOrganization,
) => {
  console.log('Import des organisations...')

  const { organizations, userOrganizationRow, sites, userOrgaSites } = await checkOrganization(
    organizationWorksheet,
    userOrganizationVersion,
    transaction,
    true, // skipCheck
  )

  for (const site of userOrgaSites.sitesToUpdate) {
    await transaction.site.update({
      where: { id: site.id },
      data: { oldBCId: site.oldBCId },
    })
  }

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
  const sitesToCreate = [...userOrgaSites.sitesToCreate, ...sites]
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
