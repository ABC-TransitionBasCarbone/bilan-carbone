import xlsx from 'node-xlsx'
import { prismaClient } from '../../../db/client'
import { RequiredEmissionFactorsColumns, uploadEmissionFactors } from './emissionFactors'
import { RequiredOrganizationsColumns, uploadOrganizations } from './organizations'
import {
  RequiredStudiesColumns,
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

const getOrganisationIndexes = (organizationHeaders: string[]): Record<string, number> => {
  if (Object.values(RequiredOrganizationsColumns).length > organizationHeaders.length) {
    throw new Error(
      `Les colonnes suivantes sont obligatoires : ${Object.values(RequiredOrganizationsColumns).join(', ')}`,
    )
  }
  return getIndexes(organizationHeaders, RequiredOrganizationsColumns, 'Organisations')
}

const getEmissionFactorsIndexes = (emissionFactorHeaders: string[]): Record<string, number> => {
  return getIndexes(emissionFactorHeaders, RequiredEmissionFactorsColumns, "Facteurs d'émissions")
}

const getStudiesIndexes = (studiesHeaders: string[]): Record<string, number> => {
  return getIndexes(studiesHeaders, RequiredStudiesColumns, 'Etudes')
}

const getStudySitesIndexes = (studiesHeaders: string[]): Record<string, number> => {
  return getIndexes(studiesHeaders, RequiredStudySitesColumns, 'Etudes - sites')
}

const getStudyExportIndexes = (studiesHeaders: string[]): Record<string, number> => {
  return getIndexes(studiesHeaders, RequiredStudyExportsColumns, 'Etudes - exports')
}

export const uploadOldBCInformations = async (file: string, email: string, organizationId: string) => {
  const user = await prismaClient.user.findUnique({ where: { email } })
  if (!user || user.organizationId !== organizationId) {
    console.log("L'utilisateur n'existe pas ou n'appartient pas à l'organisation spécifiée")
    return
  }

  const workSheetsFromFile = xlsx.parse(file)

  const organizationsSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Organisations')
  const emissionFactorsSheet = workSheetsFromFile.find((sheet) => sheet.name === "Facteurs d'émissions")
  const studiesSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes')
  const studySitesSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes - sites')
  const studyExportsSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Etudes - exports')

  if (!organizationsSheet || !emissionFactorsSheet || !studiesSheet || !studySitesSheet || !studyExportsSheet) {
    console.log(
      "Veuillez verifier que le fichier contient une feuille 'Organisations', une feuille 'Facteurs d'émissions', une feuille 'Etudes', une feuille 'Études - sites', et une feuille 'Études - exports'",
    )
    return
  }

  const organizationsIndexes = getOrganisationIndexes(organizationsSheet.data[0])
  const emissionFactorsIndexes = getEmissionFactorsIndexes(emissionFactorsSheet.data[0])
  const studiesIndexes = getStudiesIndexes(studiesSheet.data[0])
  const studySitesIndexes = getStudySitesIndexes(studySitesSheet.data[0])
  const studyExportsIndexes = getStudyExportIndexes(studyExportsSheet.data[0])

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  let hasStudiesWarning = false
  await prismaClient.$transaction(async (transaction) => {
    hasOrganizationsWarning = await uploadOrganizations(
      transaction,
      organizationsSheet.data,
      organizationsIndexes,
      organizationId,
    )
    hasEmissionFactorsWarning = await uploadEmissionFactors(
      transaction,
      emissionFactorsSheet.data,
      emissionFactorsIndexes,
      organizationId,
    )
    hasStudiesWarning = await uploadStudies(
      transaction,
      studiesIndexes,
      studiesSheet.data,
      studySitesIndexes,
      studySitesSheet.data,
      studyExportsIndexes,
      studyExportsSheet.data,
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
