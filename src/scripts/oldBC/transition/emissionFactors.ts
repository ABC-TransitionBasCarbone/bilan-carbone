import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma } from '@prisma/client'
import { v4 } from 'uuid'
import { unitsMatrix } from '../../../services/importEmissionFactor/historyUnits'
import { getEmissionQuality } from '../../../services/importEmissionFactor/import'

const getStringValue = (value: string | number) => {
  const stringValue = value ? value.toString() : ''
  return stringValue.toLocaleLowerCase() === 'null' || stringValue.toLocaleLowerCase() === 'undefined'
    ? ''
    : stringValue
}

export const uploadEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  data: (string | number)[][],
  indexes: Record<string, number>,
) => {
  console.log("Import des facteurs d'émissions...")

  const ids = data.map((row) => row[indexes['EFV_GUID']] as string)
  const existingEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  if (existingEmissionFactors.length > 0) {
    console.log(`${existingEmissionFactors.length} facteurs d'émissions déjà importés`)
  }

  const metaData = [] as Prisma.EmissionFactorMetaDataCreateManyInput[]
  const emissionFactorsToCreate = data
    .filter((row) => !row[indexes['FE_BCPlus']])
    .filter((row) => row[indexes['EF_TYPE']] === 'Consolidé')
    .filter((row) => existingEmissionFactors.every((ef) => ef.oldBCId !== row[indexes['EFV_GUID']]))

  console.log(`${emissionFactorsToCreate.length} facteurs d'émissions à importer`)
  await transaction.emissionFactor.createMany({
    data: emissionFactorsToCreate.map((row) => {
      const id = v4()
      metaData.push({
        emissionFactorId: id,
        language: 'fr',
        title: getStringValue(row[indexes['EF_VAL_LIB']]),
        attribute: getStringValue(row[indexes['EF_VAL_CARAC']]),
        frontiere: getStringValue(row[indexes['EF_VAL_COMPLEMENT']]),
        comment: `${getStringValue(row[indexes['Commentaires']])} ${getStringValue(row[indexes['DateValidité']])}`,
        location: `${getStringValue(row[indexes['NOM_PAYS']])} ${getStringValue(row[indexes['NOM_REGION']])} ${getStringValue(row[indexes['NOM_DEPARTEMENT']])}`,
      })

      return {
        id,
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        oldBCId: getStringValue(row[indexes['EFV_GUID']]),
        reliability: getEmissionQuality(row[indexes['Incertitude']] as number),
        technicalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        geographicRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        temporalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        completeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        unit: unitsMatrix[getStringValue(row[indexes['Unité_Nom']])],
        totalCo2: row[indexes['Total_CO2e']] as number,
        co2f: row[indexes['CO2f']] as number,
        ch4f: row[indexes['CH4F']] as number,
        ch4b: row[indexes['CH4B']] as number,
        n2o: row[indexes['N2O']] as number,
        co2b: row[indexes['CO2B']] as number,
        sf6: row[indexes['SF6']] as number,
        hfc: row[indexes['HFC']] as number,
        pfc: row[indexes['PFC']] as number,
        otherGES: (row[indexes['Autre_gaz']] as number) + (row[indexes['NF3']] as number),
        source: getStringValue(row[indexes['Source_Nom']]),
        location: getStringValue(row[indexes['NOM_CONTINENT']]),
      }
    }),
  })

  await transaction.emissionFactorMetaData.createMany({ data: metaData })

  const existingEmissionFactorParts = await transaction.emissionFactorPart.findMany({
    where: { oldBCId: { in: ids } },
  })
  const allEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  const emissionFactorPartsToCreate = data
    .filter((row) => !row[indexes['FE_BCPlus']])
    .filter((row) => row[indexes['EF_TYPE']] !== 'Consolidé')
    .filter((row) => existingEmissionFactorParts.every((ef) => ef.oldBCId !== row[indexes['EFV_GUID']]))
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row[indexes['GUID']]))

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
    const guid = getStringValue(row[indexes['GUID']])
    if (!sumByGuid[guid]) {
      sumByGuid[guid] = { totalCo2: 0, co2f: 0, ch4f: 0, ch4b: 0, n2o: 0, co2b: 0, sf6: 0, hfc: 0, pfc: 0, otherGES: 0 }
    }

    sumByGuid[guid].totalCo2 += row[indexes['Total_CO2e']] as number
    sumByGuid[guid].co2f += row[indexes['CO2f']] as number
    sumByGuid[guid].ch4f += row[indexes['CH4F']] as number
    sumByGuid[guid].ch4b += row[indexes['CH4B']] as number
    sumByGuid[guid].n2o += row[indexes['N2O']] as number
    sumByGuid[guid].co2b += row[indexes['CO2B']] as number
    sumByGuid[guid].sf6 += row[indexes['SF6']] as number
    sumByGuid[guid].hfc += row[indexes['HFC']] as number
    sumByGuid[guid].pfc += row[indexes['PFC']] as number
    sumByGuid[guid].otherGES += (row[indexes['Autre_gaz']] as number) + (row[indexes['NF3']] as number)
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
    .filter((row) => inconsistentGuids.every(([key]) => key !== getStringValue(row[indexes['GUID']])))
    .filter((row) => allEmissionFactors.some((ef) => ef.oldBCId === row[indexes['GUID']]))

  const partsMetaData = [] as Prisma.EmissionFactorPartMetaDataCreateManyInput[]
  console.log(`${filteredEmissionFactorPartsToCreate.length} composantes à importer`)
  await transaction.emissionFactorPart.createMany({
    data: filteredEmissionFactorPartsToCreate.map((row) => {
      const id = v4()

      partsMetaData.push({
        language: 'fr',
        title: getStringValue(row[indexes['EF_VAL_LIB']]),
        emissionFactorPartId: id,
      })
      return {
        id,
        emissionFactorId: allEmissionFactors.find((ef) => ef.oldBCId === row[indexes['GUID']])?.id as string,
        type: EmissionFactorPartType.Amont,
        oldBCId: getStringValue(row[indexes['EFV_GUID']]),
        reliability: getEmissionQuality(row[indexes['Incertitude']] as number),
        technicalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        geographicRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        temporalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        completeness: getEmissionQuality(row[indexes['Incertitude']] as number),
        totalCo2: row[indexes['Total_CO2e']] as number,
        co2f: row[indexes['CO2f']] as number,
        ch4f: row[indexes['CH4F']] as number,
        ch4b: row[indexes['CH4B']] as number,
        n2o: row[indexes['N2O']] as number,
        co2b: row[indexes['CO2B']] as number,
        sf6: row[indexes['SF6']] as number,
        hfc: row[indexes['HFC']] as number,
        pfc: row[indexes['PFC']] as number,
        otherGES: (row[indexes['Autre_gaz']] as number) + (row[indexes['NF3']] as number),
        source: getStringValue(row[indexes['Source_Nom']]),
        location: getStringValue(row[indexes['NOM_CONTINENT']]),
      }
    }),
  })
  await transaction.emissionFactorPartMetaData.createMany({ data: partsMetaData })

  return inconsistentGuids.length > 0
}
