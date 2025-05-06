import { getAccountByEmailAndOrganizationVersionId } from '@/db/account'
import {
  getOrganizationVersionById,
  getOrganizationWithSitesById,
  OrganizationVersionWithOrganization,
} from '@/db/organization'
import { Environment } from '@prisma/client'
import xlsx from 'node-xlsx'
import { prismaClient } from '../../../db/client'
import { RequiredEmissionFactorsColumns, uploadEmissionFactors } from './emissionFactors'
import { OldNewPostAndSubPostsMapping } from './newPostAndSubPosts'
import { RequiredOrganizationsColumns, uploadOrganizations } from './organizations'
import {
  RequiredStudiesColumns,
  RequiredStudyEmissionSourcesColumns,
  RequiredStudyExportsColumns,
  RequiredStudySitesColumns,
  uploadStudies,
} from './studies'

const getIndexes = (
  headers: string[],
  requiredColumns: Record<string, string>,
  sheetName: string,
): Record<string, number> => {
  const missingHeaders: string[] = []
  const indexes = {} as Record<string, number>
  Object.values(requiredColumns).forEach((requiredHeader) => {
    const index = headers.indexOf(requiredHeader)
    if (index === -1) {
      missingHeaders.push(requiredHeader)
    } else {
      indexes[requiredHeader] = index
    }
  })

  if (missingHeaders.length > 0) {
    throw new Error(`Colonnes manquantes dans la feuille '${sheetName}' : ${missingHeaders.join(', ')}`)
  }

  return indexes
}

const getOrganisationIndexes = (headers: string[]): Record<string, number> => {
  if (Object.values(RequiredOrganizationsColumns).length > headers.length) {
    throw new Error(
      `Les colonnes suivantes sont obligatoires : ${Object.values(RequiredOrganizationsColumns).join(', ')}`,
    )
  }
  return getIndexes(headers, RequiredOrganizationsColumns, 'Organisations')
}

const getEmissionFactorsIndexes = (headers: string[]): Record<string, number> => {
  return getIndexes(headers, RequiredEmissionFactorsColumns, "Facteurs d'émissions")
}

const getStudiesIndexes = (headers: string[]): Record<string, number> => {
  return getIndexes(headers, RequiredStudiesColumns, 'Etudes')
}

const getStudySitesIndexes = (headers: string[]): Record<string, number> => {
  return getIndexes(headers, RequiredStudySitesColumns, 'Etudes - sites')
}

const getStudyExportIndexes = (headers: string[]): Record<string, number> => {
  return getIndexes(headers, RequiredStudyExportsColumns, 'Etudes - exports')
}

const getStudyEmissionSourcesIndexes = (headers: string[]): Record<string, number> => {
  return getIndexes(headers, RequiredStudyEmissionSourcesColumns, 'Données sources')
}

export const uploadOldBCInformations = async (file: string, email: string, organizationVersionId: string) => {
  const postAndSubPostsOldNewMapping = new OldNewPostAndSubPostsMapping()

  const account = await getAccountByEmailAndOrganizationVersionId(email, organizationVersionId)
  if (!account) {
    console.log("L'utilisateur n'existe pas ou n'appartient pas à l'organisation spécifiée")
    return
  }

  const accountOrganizationVersion = (await getOrganizationVersionById(
    account.organizationVersionId,
  )) as OrganizationVersionWithOrganization

  if (!accountOrganizationVersion) {
    throw new Error(`La version de l'organisation de l'utilisateur n'existe pas.`)
  }

  if (!(accountOrganizationVersion.environment === Environment.BC)) {
    throw new Error(`L'organisation de l'utilisateur n'est pas dans l'environnement BC+.`)
  }

  const accountOrganization = await getOrganizationWithSitesById(accountOrganizationVersion.organizationId)
  if (!accountOrganization) {
    throw new Error("L'organisation de l'utilisateur est introuvable.")
  }

  const workSheetsFromFile = xlsx.parse(file)

  const organizationsSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Organisations')
  const emissionFactorsSheet = workSheetsFromFile.find((sheet) => sheet.name === "Facteurs d'émissions")
  const studiesSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes')
  const studySitesSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes - sites')
  const studyExportsSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes - exports')
  const studyEmissionSourceSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Données sources')

  if (
    !organizationsSheet ||
    !emissionFactorsSheet ||
    !studiesSheet ||
    !studySitesSheet ||
    !studyExportsSheet ||
    !studyEmissionSourceSheet
  ) {
    console.log(
      "Veuillez verifier que le fichier contient une feuille 'Organisations', une feuille 'Facteurs d'émissions', une feuille 'Etudes', une feuille 'Études - sites', une feuille 'Études - exports', et une feuille 'Données sources'",
    )
    return
  }

  const organizationsIndexes = getOrganisationIndexes(organizationsSheet.data[0])
  const emissionFactorsIndexes = getEmissionFactorsIndexes(emissionFactorsSheet.data[0])
  const studiesIndexes = getStudiesIndexes(studiesSheet.data[0])
  const studySitesIndexes = getStudySitesIndexes(studySitesSheet.data[0])
  const studyExportsIndexes = getStudyExportIndexes(studyExportsSheet.data[0])
  const studyEmissionSourcesIndexes = getStudyEmissionSourcesIndexes(studyEmissionSourceSheet.data[0])

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  let hasStudiesWarning = false

  await prismaClient.$transaction(async (transaction) => {
    hasOrganizationsWarning = await uploadOrganizations(
      transaction,
      organizationsSheet.data,
      organizationsIndexes,
      accountOrganizationVersion,
    )
    hasEmissionFactorsWarning = await uploadEmissionFactors(
      transaction,
      emissionFactorsSheet.data,
      emissionFactorsIndexes,
      accountOrganizationVersion.id,
    )
    hasStudiesWarning = await uploadStudies(
      transaction,
      postAndSubPostsOldNewMapping,
      account.id,
      organizationVersionId,
      studiesIndexes,
      studiesSheet.data,
      studySitesIndexes,
      studySitesSheet.data,
      studyExportsIndexes,
      studyExportsSheet.data,
      studyEmissionSourcesIndexes,
      studyEmissionSourceSheet.data,
    )
  })

  if (hasOrganizationsWarning) {
    console.log(
      'Attention, certaines organisations (basé sur le SIRET, ou le nom) existent déjà. Ces dernières ont été ignorées. Veuillez verifier que toutes vos données sont correctes.',
    )
  }
  if (hasEmissionFactorsWarning) {
    console.log(
      "Attention, certains facteurs d'emissions ont des sommes inconsistentes et ont été ignorées. Veuillez verifier que toutes vos données sont correctes.",
    )
  }

  if (hasStudiesWarning) {
    console.log(
      'Attention, certaines études ont été ignorées. Veuillez verifier que toutes vos données sont correctes.',
    )
  }
}
