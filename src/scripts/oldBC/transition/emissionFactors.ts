import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma } from '@prisma/client'
import { v4 } from 'uuid'
import { OrganizationVersionWithOrganization } from '../../../db/organization'
import { unitsMatrix } from '../../../services/importEmissionFactor/historyUnits'
import { getEmissionQuality } from '../../../services/importEmissionFactor/import'
import { EmissionFactorsWorkSheet } from './oldBCWorkSheetsReader'

const getStringValue = (value: string | number) => {
  const stringValue = value ? value.toString() : ''
  return stringValue.toLocaleLowerCase() === 'null' || stringValue.toLocaleLowerCase() === 'undefined'
    ? ''
    : stringValue
}

export const uploadEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  emissionFactorsWorksheet: EmissionFactorsWorkSheet,
  organizationVersion: OrganizationVersionWithOrganization,
) => {
  console.log("Import des facteurs d'émissions...")
  const ids = emissionFactorsWorksheet.getRows().map((row) => row.EFV_GUID as string)
  const existingEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  if (existingEmissionFactors.length > 0) {
    console.log(`${existingEmissionFactors.length} facteurs d'émissions déjà importés`)
  }

  const metaData = [] as Prisma.EmissionFactorMetaDataCreateManyInput[]
  const emissionFactorsToCreate = emissionFactorsWorksheet
    .getRows()
    .filter((row) => !row.FE_BCPlus)
    .filter((row) => row.EF_TYPE === 'Consolidé')
    .filter((row) => existingEmissionFactors.every((ef) => ef.oldBCId !== row.EFV_GUID))

  console.log(`${emissionFactorsToCreate.length} facteurs d'émissions à importer`)

  const createdEmissionFactor = await transaction.emissionFactor.createMany({
    data: emissionFactorsToCreate.map((row) => {
      const id = v4()
      metaData.push({
        emissionFactorId: id,
        language: 'fr',
        title: getStringValue(row.EF_VAL_LIB),
        attribute: getStringValue(row.EF_VAL_CARAC),
        frontiere: getStringValue(row.EF_VAL_COMPLEMENT),
        comment: `${getStringValue(row.Commentaires)} ${getStringValue(row.DateValidité)}`,
        location: `${getStringValue(row.NOM_PAYS)} ${getStringValue(row.NOM_REGION)} ${getStringValue(row.NOM_DEPARTEMENT)}`,
      })

      return {
        id,
        organizationId: organizationVersion.organizationId,
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        oldBCId: getStringValue(row.EFV_GUID),
        reliability: getEmissionQuality(row.Incertitude as number),
        technicalRepresentativeness: getEmissionQuality(row.Incertitude as number),
        geographicRepresentativeness: getEmissionQuality(row.Incertitude as number),
        temporalRepresentativeness: getEmissionQuality(row.Incertitude as number),
        completeness: getEmissionQuality(row.Incertitude as number),
        unit: unitsMatrix[getStringValue(row.Unité_Nom)],
        totalCo2: row.Total_CO2e as number,
        co2f: row.CO2f as number,
        ch4f: row.CH4f as number,
        ch4b: row.CH4b as number,
        n2o: row.N2O as number,
        co2b: row.CO2b as number,
        sf6: row.SF6 as number,
        hfc: row.HFC as number,
        pfc: row.PFC as number,
        otherGES: (row.Autre_gaz as number) + (row.NF3 as number),
        source: getStringValue(row.Source_Nom),
        location: getStringValue(row.NOM_CONTINENT),
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
    .filter((row) => !row.FE_BCPlus)
    .filter((row) => row.EF_TYPE !== 'Consolidé')
    .filter((row) => existingEmissionFactorParts.every((ef) => ef.oldBCId !== row.EFV_GUID))
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row.GUID))

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
    const guid = getStringValue(row.GUID)
    if (!sumByGuid[guid]) {
      sumByGuid[guid] = { totalCo2: 0, co2f: 0, ch4f: 0, ch4b: 0, n2o: 0, co2b: 0, sf6: 0, hfc: 0, pfc: 0, otherGES: 0 }
    }

    sumByGuid[guid].totalCo2 += row.Total_CO2e as number
    sumByGuid[guid].co2f += row.CO2f as number
    sumByGuid[guid].ch4f += row.CH4f as number
    sumByGuid[guid].ch4b += row.CH4b as number
    sumByGuid[guid].n2o += row.N2O as number
    sumByGuid[guid].co2b += row.CO2b as number
    sumByGuid[guid].sf6 += row.SF6 as number
    sumByGuid[guid].hfc += row.HFC as number
    sumByGuid[guid].pfc += row.PFC as number
    sumByGuid[guid].otherGES += (row.Autre_gaz as number) + (row.NF3 as number)
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
    .filter((row) => inconsistentGuids.every(([key]) => key !== getStringValue(row.GUID)))
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row.GUID))

  const partsMetaData = [] as Prisma.EmissionFactorPartMetaDataCreateManyInput[]
  console.log(`${filteredEmissionFactorPartsToCreate.length} composantes à importer`)

  const createdEmissionFactorPart = await transaction.emissionFactorPart.createMany({
    data: filteredEmissionFactorPartsToCreate.map((row) => {
      const id = v4()

      partsMetaData.push({
        language: 'fr',
        title: getStringValue(row.EF_VAL_LIB),
        emissionFactorPartId: id,
      })
      return {
        id,
        emissionFactorId: allEmissionFactors.find((ef) => ef.oldBCId === row.GUID)?.id as string,
        type: EmissionFactorPartType.Amont,
        oldBCId: getStringValue(row.EFV_GUID),
        reliability: getEmissionQuality(row.Incertitude as number),
        technicalRepresentativeness: getEmissionQuality(row.Incertitude as number),
        geographicRepresentativeness: getEmissionQuality(row.Incertitude as number),
        temporalRepresentativeness: getEmissionQuality(row.Incertitude as number),
        completeness: getEmissionQuality(row.Incertitude as number),
        totalCo2: row.Total_CO2e as number,
        co2f: row.CO2f as number,
        ch4f: row.CH4f as number,
        ch4b: row.CH4b as number,
        n2o: row.N2O as number,
        co2b: row.CO2b as number,
        sf6: row.SF6 as number,
        hfc: row.HFC as number,
        pfc: row.PFC as number,
        otherGES: (row.Autre_gaz as number) + (row.NF3 as number),
        source: getStringValue(row.Source_Nom),
        location: getStringValue(row.NOM_CONTINENT),
      }
    }),
  })

  console.log(createdEmissionFactorPart.count, 'composantes importées')
  const createdEmissionFactorMetadata = await transaction.emissionFactorPartMetaData.createMany({ data: partsMetaData })

  console.log(createdEmissionFactorMetadata.count, 'métadonnées de composantes importées')

  return inconsistentGuids.length > 0
}
