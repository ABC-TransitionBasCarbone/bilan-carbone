'use server'
import { prismaClient } from '@/db/client'
import { getTranslations } from 'next-intl/server'
import xlsx from 'node-xlsx'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

const requiredColumns = [
  'ID_ENTITE',
  'NOM_ORGANISATION',
  'NOM_ENTITE',
  'ENTITE_PRINCIPALE',
  'SIRET',
  'ID_ENTITE_MERE',
  'IS_USER_ORGA',
]

const getColumnsIndex = async (headers: string[]) => {
  const t = await getTranslations('transition')

  if (requiredColumns.length > headers.length) {
    return { success: false, error: `${t('requiredHeaders')} ${requiredColumns.join(', ')}` }
  }

  const missingHeaders: string[] = []
  const indexes: Record<string, number> = {}
  requiredColumns.forEach((header) => {
    const index = headers.indexOf(header)

    if (index === -1) {
      missingHeaders.push(header)
    } else {
      indexes[header] = index
    }
  })

  if (missingHeaders.length > 0) {
    return { success: false, error: `${t('missingHeaders')} ${missingHeaders.join(', ')}` }
  }
  return { success: true, indexes }
}

const getOrganizationId = (id: string, oldUserOrganizationId: string, userOrganizationId: string) => {
  // Si l'id que je recherche est l'ancienne id principale, je la remplace par le nouveau
  if (id === oldUserOrganizationId) {
    return userOrganizationId
  }
  return id
}

export const downloadOrganizations = async (file: File) => {
  const session = await auth()

  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const userOrganizationId = session.user.organizationId
  if (!userOrganizationId) {
    return NOT_AUTHORIZED
  }

  const workSheetsFromFile = xlsx.parse(await file.arrayBuffer())
  const data = workSheetsFromFile[0].data
  const { success, error, indexes } = await getColumnsIndex(data[0])
  if (!success || !indexes) {
    return error
  }

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
        { id: { in: organizations.map((organization) => organization.id) } },
        // Ou les siret deja existant
        { siret: { in: organizations.map((organization) => organization.siret).filter((siret) => siret) } },
        // Ou si il n'y a pas de siret, les organisations avec le même nom, dans mon organisation
        {
          parentId: userOrganizationId,
          name: {
            in: organizations.filter((organization) => !organization.siret).map((organization) => organization.name),
          },
        },
      ],
    },
  })

  const oldUserOrganizationId = organizations.find((organization) => organization.userOrga === 1)?.id
  await prismaClient.$transaction(async (transaction) => {
    const newOrganizations = organizations
      .filter(
        (organization) =>
          // On ne crée pas les organizations avec un id déjà existant
          // Ou avec un siret existant
          // Ou si il n'y a pas de siret, avec un nom existant dans mon organisation
          !existingOrganizations.some(
            ({ id, siret, name }) =>
              id === organization.id ||
              (organization.siret ? siret === organization.siret : name === organization.name),
          ),
      )
      .filter((organization) => organization.mainEntity === 1)
    // Je crée toutes les organisations sauf la mienne
    const organizationsToCreate = newOrganizations.filter((organization) => organization.userOrga !== 1)
    if (organizationsToCreate.length > 0) {
      await transaction.organization.createMany({
        data: organizationsToCreate.map((organization) => ({
          parentId: session.user.organizationId,
          id: organization.id,
          siret: organization.siret,
          name: organization.name,
          isCR: false,
        })),
      })
    }

    if (newOrganizations.length > 0) {
      // Et pour toutes les organisations j'ajoute un site par defaut
      await transaction.site.createMany({
        data: newOrganizations.map((organization) => ({
          organizationId: getOrganizationId(organization.id, oldUserOrganizationId, userOrganizationId),
          name: organization.entityName,
        })),
      })
    }

    // Et je crée tous les autres sites
    const sitesToCreate = organizations
      .filter((organization) => organization.mainEntity !== 1)
      .map((organization) => ({
        organizationId: getOrganizationId(organization.parentId, oldUserOrganizationId, userOrganizationId),
        name: organization.entityName,
      }))
      .filter((site) => site.organizationId !== userOrganizationId)
    if (sitesToCreate.length > 0) {
      await transaction.site.createMany({ data: sitesToCreate })
    }
  })

  if (existingOrganizations.length > 0) {
    const t = await getTranslations('transition')
    return t('existingOrganizations')
  }
}
