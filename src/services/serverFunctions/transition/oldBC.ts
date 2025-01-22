'use server'
import { prismaClient } from '@/db/client'
import { getTranslations } from 'next-intl/server'
import xlsx from 'node-xlsx'
import { auth } from '../../auth'
import { NOT_AUTHORIZED } from '../../permissions/check'
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

const getColumnsIndex = async (organizationHeaders: string[], emissionFactorHeaders: string[]) => {
  const t = await getTranslations('transition')

  if (requiredOrganizationsColumns.length > organizationHeaders.length) {
    return { success: false, error: `${t('requiredHeaders')} ${requiredOrganizationsColumns.join(', ')}` }
  }
  const missingHeaders: string[] = []
  const indexes = { organizations: {} as Record<string, number>, emissionFactors: {} as Record<string, number> }
  requiredOrganizationsColumns.forEach((header) => {
    const index = organizationHeaders.indexOf(header)
    if (index === -1) {
      missingHeaders.push(header)
    } else {
      indexes.organizations[header] = index
    }
  })

  if (missingHeaders.length > 0) {
    return { success: false, error: `${t('missingOrganizationsHeaders')} ${missingHeaders.join(', ')}` }
  }

  requiredEmissionFactorsColumns.forEach((header) => {
    const index = emissionFactorHeaders.indexOf(header)
    if (index === -1) {
      missingHeaders.push(header)
    } else {
      indexes.emissionFactors[header] = index
    }
  })

  if (missingHeaders.length > 0) {
    return { success: false, error: `${t('missingEmissionFactorsHeaders')} ${missingHeaders.join(', ')}` }
  }
  return { success: true, indexes }
}

export const uploadOldBCInformations = async (file: File) => {
  const session = await auth()
  const t = await getTranslations('transition')

  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const userOrganizationId = session.user.organizationId
  if (!userOrganizationId) {
    return NOT_AUTHORIZED
  }

  const workSheetsFromFile = xlsx.parse(await file.arrayBuffer())
  const organizationsSheet = workSheetsFromFile.find((sheet) => sheet.name === 'Organisations')
  const emissionFactorsSheet = workSheetsFromFile.find((sheet) => sheet.name === "Facteurs d'émissions")
  if (!organizationsSheet || !emissionFactorsSheet) {
    return t('missingSheets')
  }

  const { success, error, indexes } = await getColumnsIndex(organizationsSheet.data[0], emissionFactorsSheet.data[0])
  if (!success || !indexes) {
    return error
  }

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  await prismaClient.$transaction(async (transaction) => {
    hasOrganizationsWarning = await uploadOrganizations(
      transaction,
      organizationsSheet.data,
      indexes.organizations,
      userOrganizationId,
    )
    hasEmissionFactorsWarning = await uploadEmissionFactors(
      transaction,
      emissionFactorsSheet.data,
      indexes.emissionFactors,
    )
  })

  return `${hasOrganizationsWarning ? t('existingOrganizations') : ''} ${hasEmissionFactorsWarning ? t('existingEmissionFactors') : ''}`
}
