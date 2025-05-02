import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma } from '@prisma/client'
import { v4 } from 'uuid'
import { unitsMatrix } from '../../../services/importEmissionFactor/historyUnits'
import { getEmissionQuality } from '../../../services/importEmissionFactor/import'
import { EmissionFactorsWorkSheet } from './oldBCWorkSheetsReader'

export enum RequiredEmissionFactorsColumns {
  EFV_GUID = 'EFV_GUID',
  ID_Source_Ref = 'ID_Source_Ref',
  GUID = 'GUID',
  EF_VAL_LIB = 'EF_VAL_LIB',
  EF_VAL_CARAC = 'EF_VAL_CARAC',
  EF_VAL_COMPLEMENT = 'EF_VAL_COMPLEMENT',
  Commentaires = 'Commentaires',
  DateValidité = 'DateValidité',
  Incertitude = 'Incertitude',
  Unité_Nom = 'Unité_Nom',
  EF_Statut = 'EF_Statut',
  EF_TYPE = 'EF_TYPE',
  Total_CO2e = 'Total_CO2e',
  CO2f = 'CO2f',
  CH4f = 'CH4f',
  CH4b = 'CH4b',
  N2O = 'N2O',
  HFC = 'HFC',
  PFC = 'PFC',
  SF6 = 'SF6',
  NF3 = 'NF3',
  CO2b = 'CO2b',
  Autre_gaz = 'Autre_gaz',
  Qualité_TeR = 'Qualité_TeR',
  Qualité_GR = 'Qualité_GR',
  Qualité_TiR = 'Qualité_TiR',
  Qualité_C = 'Qualité_C',
  Source_Nom = 'Source_Nom',
  NOM_CONTINENT = 'NOM_CONTINENT',
  NOM_PAYS = 'NOM_PAYS',
  NOM_REGION = 'NOM_REGION',
  NOM_DEPARTEMENT = 'NOM_DEPARTEMENT',
  FE_BCPlus = 'FE_BCPlus',
}

const getStringValue = (value: string | number) => {
  const stringValue = value ? value.toString() : ''
  return stringValue.toLocaleLowerCase() === 'null' || stringValue.toLocaleLowerCase() === 'undefined'
    ? ''
    : stringValue
}

export const uploadEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  emissionFactorsWorksheet: EmissionFactorsWorkSheet,
  organizationId: string,
) => {
  console.log("Import des facteurs d'émissions...")
  const indexes = emissionFactorsWorksheet.getIndexes()
  const ids = emissionFactorsWorksheet
    .getRows()
    .map((row) => row[indexes[RequiredEmissionFactorsColumns.EFV_GUID]] as string)
  const existingEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  if (existingEmissionFactors.length > 0) {
    console.log(`${existingEmissionFactors.length} facteurs d'émissions déjà importés`)
  }

  const metaData = [] as Prisma.EmissionFactorMetaDataCreateManyInput[]
  const emissionFactorsToCreate = emissionFactorsWorksheet
    .getRows()
    .filter((row) => !row[indexes[RequiredEmissionFactorsColumns.FE_BCPlus]])
    .filter((row) => row[indexes[RequiredEmissionFactorsColumns.EF_TYPE]] === 'Consolidé')
    .filter((row) =>
      existingEmissionFactors.every((ef) => ef.oldBCId !== row[indexes[RequiredEmissionFactorsColumns.EFV_GUID]]),
    )

  console.log(`${emissionFactorsToCreate.length} facteurs d'émissions à importer`)

  const createdEmissionFactor = await transaction.emissionFactor.createMany({
    data: emissionFactorsToCreate.map((row) => {
      const id = v4()
      metaData.push({
        emissionFactorId: id,
        language: 'fr',
        title: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EF_VAL_LIB]]),
        attribute: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EF_VAL_CARAC]]),
        frontiere: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EF_VAL_COMPLEMENT]]),
        comment: `${getStringValue(row[indexes[RequiredEmissionFactorsColumns.Commentaires]])} ${getStringValue(row[indexes[RequiredEmissionFactorsColumns.DateValidité]])}`,
        location: `${getStringValue(row[indexes[RequiredEmissionFactorsColumns.NOM_PAYS]])} ${getStringValue(row[indexes[RequiredEmissionFactorsColumns.NOM_REGION]])} ${getStringValue(row[indexes[RequiredEmissionFactorsColumns.NOM_DEPARTEMENT]])}`,
      })

      return {
        id,
        organizationId,
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        oldBCId: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EFV_GUID]]),
        reliability: getEmissionQuality(row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number),
        technicalRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        geographicRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        temporalRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        completeness: getEmissionQuality(row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number),
        unit: unitsMatrix[getStringValue(row[indexes[RequiredEmissionFactorsColumns.Unité_Nom]])],
        totalCo2: row[indexes[RequiredEmissionFactorsColumns.Total_CO2e]] as number,
        co2f: row[indexes[RequiredEmissionFactorsColumns.CO2f]] as number,
        ch4f: row[indexes[RequiredEmissionFactorsColumns.CH4f]] as number,
        ch4b: row[indexes[RequiredEmissionFactorsColumns.CH4b]] as number,
        n2o: row[indexes[RequiredEmissionFactorsColumns.N2O]] as number,
        co2b: row[indexes[RequiredEmissionFactorsColumns.CO2b]] as number,
        sf6: row[indexes[RequiredEmissionFactorsColumns.SF6]] as number,
        hfc: row[indexes[RequiredEmissionFactorsColumns.HFC]] as number,
        pfc: row[indexes[RequiredEmissionFactorsColumns.PFC]] as number,
        otherGES:
          (row[indexes[RequiredEmissionFactorsColumns.Autre_gaz]] as number) +
          (row[indexes[RequiredEmissionFactorsColumns.NF3]] as number),
        source: getStringValue(row[indexes[RequiredEmissionFactorsColumns.Source_Nom]]),
        location: getStringValue(row[indexes[RequiredEmissionFactorsColumns.NOM_CONTINENT]]),
      }
    }),
  })

  console.log(createdEmissionFactor.count, "facteurs d'émissions importés")

  const createdMetadata = await transaction.emissionFactorMetaData.createMany({ data: metaData })

  console.log(createdMetadata.count, "métadonnées de facteurs d'émissions importées")

  const existingEmissionFactorParts = await transaction.emissionFactorPart.findMany({
    where: { oldBCId: { in: ids } },
  })
  const allEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  const emissionFactorPartsToCreate = emissionFactorsWorksheet
    .getRows()
    .filter((row) => !row[indexes[RequiredEmissionFactorsColumns.FE_BCPlus]])
    .filter((row) => row[indexes[RequiredEmissionFactorsColumns.EF_TYPE]] !== 'Consolidé')
    .filter((row) =>
      existingEmissionFactorParts.every((ef) => ef.oldBCId !== row[indexes[RequiredEmissionFactorsColumns.EFV_GUID]]),
    )
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row[indexes[RequiredEmissionFactorsColumns.GUID]]))

  const sumByGuid: Record<
    string,
    {
      totalCo2: number
      co2f: number
      ch4f: number
      ch4b: number
      n2o: number
      co2b: number
      sf6: number
      hfc: number
      pfc: number
      otherGES: number
    }
  > = {}

  emissionFactorPartsToCreate.forEach((row) => {
    const guid = getStringValue(row[indexes[RequiredEmissionFactorsColumns.GUID]])
    if (!sumByGuid[guid]) {
      sumByGuid[guid] = { totalCo2: 0, co2f: 0, ch4f: 0, ch4b: 0, n2o: 0, co2b: 0, sf6: 0, hfc: 0, pfc: 0, otherGES: 0 }
    }

    sumByGuid[guid].totalCo2 += row[indexes[RequiredEmissionFactorsColumns.Total_CO2e]] as number
    sumByGuid[guid].co2f += row[indexes[RequiredEmissionFactorsColumns.CO2f]] as number
    sumByGuid[guid].ch4f += row[indexes[RequiredEmissionFactorsColumns.CH4f]] as number
    sumByGuid[guid].ch4b += row[indexes[RequiredEmissionFactorsColumns.CH4b]] as number
    sumByGuid[guid].n2o += row[indexes[RequiredEmissionFactorsColumns.N2O]] as number
    sumByGuid[guid].co2b += row[indexes[RequiredEmissionFactorsColumns.CO2b]] as number
    sumByGuid[guid].sf6 += row[indexes[RequiredEmissionFactorsColumns.SF6]] as number
    sumByGuid[guid].hfc += row[indexes[RequiredEmissionFactorsColumns.HFC]] as number
    sumByGuid[guid].pfc += row[indexes[RequiredEmissionFactorsColumns.PFC]] as number
    sumByGuid[guid].otherGES +=
      (row[indexes[RequiredEmissionFactorsColumns.Autre_gaz]] as number) +
      (row[indexes[RequiredEmissionFactorsColumns.NF3]] as number)
  })

  const inconsistentGuids = Object.entries(sumByGuid).filter(([guid, sum]) => {
    const emissionFactor = allEmissionFactors.find((ef) => ef.oldBCId === guid)
    return (
      emissionFactor &&
      (emissionFactor.totalCo2 !== sum.totalCo2 ||
        emissionFactor.co2f !== sum.co2f ||
        emissionFactor.ch4f !== sum.ch4f ||
        emissionFactor.ch4b !== sum.ch4b ||
        emissionFactor.n2o !== sum.n2o ||
        emissionFactor.co2b !== sum.co2b ||
        emissionFactor.sf6 !== sum.sf6 ||
        emissionFactor.hfc !== sum.hfc ||
        emissionFactor.pfc !== sum.pfc ||
        emissionFactor.otherGES !== sum.otherGES)
    )
  })

  if (inconsistentGuids.length > 0) {
    console.log(`${inconsistentGuids.length} facteurs d'émissions avec des parties incohérentes, donc ignorées`)
  }

  const filteredEmissionFactorPartsToCreate = emissionFactorPartsToCreate
    .filter((row) =>
      inconsistentGuids.every(([key]) => key !== getStringValue(row[indexes[RequiredEmissionFactorsColumns.GUID]])),
    )
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row[indexes[RequiredEmissionFactorsColumns.GUID]]))

  const partsMetaData = [] as Prisma.EmissionFactorPartMetaDataCreateManyInput[]
  console.log(`${filteredEmissionFactorPartsToCreate.length} composantes à importer`)

  const createdEmissionFactorPart = await transaction.emissionFactorPart.createMany({
    data: filteredEmissionFactorPartsToCreate.map((row) => {
      const id = v4()

      partsMetaData.push({
        language: 'fr',
        title: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EF_VAL_LIB]]),
        emissionFactorPartId: id,
      })
      return {
        id,
        emissionFactorId: allEmissionFactors.find(
          (ef) => ef.oldBCId === row[indexes[RequiredEmissionFactorsColumns.GUID]],
        )?.id as string,
        type: EmissionFactorPartType.Amont,
        oldBCId: getStringValue(row[indexes[RequiredEmissionFactorsColumns.EFV_GUID]]),
        reliability: getEmissionQuality(row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number),
        technicalRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        geographicRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        temporalRepresentativeness: getEmissionQuality(
          row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number,
        ),
        completeness: getEmissionQuality(row[indexes[RequiredEmissionFactorsColumns.Incertitude]] as number),
        totalCo2: row[indexes[RequiredEmissionFactorsColumns.Total_CO2e]] as number,
        co2f: row[indexes[RequiredEmissionFactorsColumns.CO2f]] as number,
        ch4f: row[indexes[RequiredEmissionFactorsColumns.CH4f]] as number,
        ch4b: row[indexes[RequiredEmissionFactorsColumns.CH4b]] as number,
        n2o: row[indexes[RequiredEmissionFactorsColumns.N2O]] as number,
        co2b: row[indexes[RequiredEmissionFactorsColumns.CO2b]] as number,
        sf6: row[indexes[RequiredEmissionFactorsColumns.SF6]] as number,
        hfc: row[indexes[RequiredEmissionFactorsColumns.HFC]] as number,
        pfc: row[indexes[RequiredEmissionFactorsColumns.PFC]] as number,
        otherGES:
          (row[indexes[RequiredEmissionFactorsColumns.Autre_gaz]] as number) +
          (row[indexes[RequiredEmissionFactorsColumns.NF3]] as number),
        source: getStringValue(row[indexes[RequiredEmissionFactorsColumns.Source_Nom]]),
        location: getStringValue(row[indexes[RequiredEmissionFactorsColumns.NOM_CONTINENT]]),
      }
    }),
  })

  console.log(createdEmissionFactorPart.count, 'composantes importées')
  const createdEmissionFactorMetadata = await transaction.emissionFactorPartMetaData.createMany({ data: partsMetaData })

  console.log(createdEmissionFactorMetadata.count, 'métadonnées de composantes importées')

  return inconsistentGuids.length > 0
}
