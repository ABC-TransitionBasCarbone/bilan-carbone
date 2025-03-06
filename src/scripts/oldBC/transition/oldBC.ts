import xlsx from 'node-xlsx'
import { prismaClient } from '../../../db/client'
import { uploadEmissionFactors } from './emissionFactors'
import { uploadOrganizations } from './organizations'

const requiredOrganizationsColumns = [
  'ID_ENTITE',
  'NOM_ORGANISATION',
  'NOM_ENTITE',
  'ENTITE_PRINCIPALE',
  'SIRET',
  'ID_ENTITE_MERE',
  'IS_USER_ORGA',
]

const requiredEmissionFactorsColumns = [
  'EFV_GUID',
  'ID_Source_Ref',
  'GUID',
  'EF_VAL_LIB',
  'EF_VAL_CARAC',
  'EF_VAL_COMPLEMENT',
  'Commentaires',
  'DateValidité',
  'Incertitude',
  'Unité_Nom',
  'EF_Statut',
  'EF_TYPE',
  'Total_CO2e',
  'CO2f',
  'CH4f',
  'CH4b',
  'N2O',
  'HFC',
  'PFC',
  'SF6',
  'CO2b',
  'Autre_gaz',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
  'Source_Nom',
  'NOM_CONTINENT',
  'NOM_PAYS',
  'NOM_REGION',
  'NOM_DEPARTEMENT',
  'FE_BCPlus',
]

const requiredStudiesColumns = [
  'IDETUDE',
  'NOM_ETUDE',
  'PERIODE_DEBUT',
  'PERIODE_FIN',
  'ID_ENTITE',
  'LIB_REFERENTIEL',
  'LIBELLE_MODE_CONTROLE',
]

const getIndexes = (headers: string[], requiredHeaders: string[], sheetName: string): Record<string, number> => {
  const missingHeaders: string[] = []
  const indexes = {} as Record<string, number>
  requiredHeaders.forEach((requiredHeader) => {
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
  if (requiredOrganizationsColumns.length > organizationHeaders.length) {
    throw new Error(`Les colonnes suivantes sont obligatoires : ${requiredOrganizationsColumns.join(', ')}`)
  }
  return getIndexes(organizationHeaders, requiredOrganizationsColumns, 'Organisations')
}

const getEmissionFactorsIndexes = (emissionFactorHeaders: string[]): Record<string, number> => {
  return getIndexes(emissionFactorHeaders, requiredEmissionFactorsColumns, "Facteurs d'émissions")
}

const getStudiesIndexes = (studiesHeaders: string[]): Record<string, number> => {
  return getIndexes(studiesHeaders, requiredStudiesColumns, 'Etudes')
}

const getColumnsIndex = async (
  organizationHeaders: string[],
  emissionFactorHeaders: string[],
  studiesHeaders: string[],
) => {
  const indexes = {
    organizations: {} as Record<string, number>,
    emissionFactors: {} as Record<string, number>,
    studies: {} as Record<string, number>,
  }
  try {
    indexes.organizations = getOrganisationIndexes(organizationHeaders)
    indexes.emissionFactors = getEmissionFactorsIndexes(emissionFactorHeaders)
    indexes.studies = getStudiesIndexes(studiesHeaders)
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    } else {
      throw error
    }
  }

  return { success: true, indexes }
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

  if (!organizationsSheet || !emissionFactorsSheet || !studiesSheet) {
    console.log(
      "Veuillez verifier que le fichier contient une feuille 'Organisations', une feuille 'Facteurs d'émissions, et une feuille 'Etudes'",
    )
    return
  }

  const { success, error, indexes } = await getColumnsIndex(
    organizationsSheet.data[0],
    emissionFactorsSheet.data[0],
    studiesSheet.data[0],
  )
  if (!success || !indexes) {
    console.log(error)
    return
  }

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  await prismaClient.$transaction(async (transaction) => {
    hasOrganizationsWarning = await uploadOrganizations(
      transaction,
      organizationsSheet.data,
      indexes.organizations,
      organizationId,
    )
    hasEmissionFactorsWarning = await uploadEmissionFactors(
      transaction,
      emissionFactorsSheet.data,
      indexes.emissionFactors,
      organizationId,
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
}
