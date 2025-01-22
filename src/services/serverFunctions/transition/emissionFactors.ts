import { unitsMatrix } from '@/services/importEmissionFactor/historyUnits'
import { getEmissionQuality } from '@/services/importEmissionFactor/import'
import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma } from '@prisma/client'
import { v4 } from 'uuid'

export const uploadEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  data: (string | number)[][],
  indexes: Record<string, number>,
) => {
  const ids = data.map((row) => row[indexes['EFV_GUID']] as string)
  const existingEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids } },
  })

  const metaData = [] as Prisma.EmissionFactorMetaDataCreateManyInput[]
  await transaction.emissionFactor.createMany({
    data: data
      .filter((row) => !row[indexes['FE_BCPlus']])
      .filter((row) => row[indexes['EF_TYPE']] === 'Consolidé')
      .filter((row) => existingEmissionFactors.every((ef) => ef.oldBCId !== row[indexes['EFV_GUID']]))
      .map((row) => {
        const id = v4()
        metaData.push({
          emissionFactorId: id,
          language: 'fr',
          title: row[indexes['EF_VAL_LIB']] as string,
          attribute: row[indexes['EF_VAL_CARAC']] as string,
          frontiere: row[indexes['EF_VAL_COMPLEMENT']] as string,
          comment: `${row[indexes['Commentaires']]} ${row[indexes['DateValidité']]}`,
          location: `${row[indexes['NOM_PAYS']]} ${row[indexes['NOM_REGION']]} ${row[indexes['NOM_DEPARTEMENT']]}`,
        })

        return {
          id,
          importedFrom: Import.Manual,
          status: EmissionFactorStatus.Valid,
          oldBCId: row[indexes['EFV_GUID']] as string,
          reliability: getEmissionQuality(row[indexes['Incertitude']] as number),
          technicalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
          geographicRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
          temporalRepresentativeness: getEmissionQuality(row[indexes['Incertitude']] as number),
          completeness: getEmissionQuality(row[indexes['Incertitude']] as number),
          unit: unitsMatrix[row[indexes['Unité_Nom']] as string],
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
          source: row[indexes['Source_Nom']] as string,
          location: row[indexes['NOM_CONTINENT']] as string,
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
    .filter((row) => allEmissionFactors.every((ef) => ef.oldBCId !== row[indexes['GUID']]))
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
    const guid = row[indexes['GUID']] as string
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
    const emissionFactor = existingEmissionFactors.find((ef) => ef.oldBCId === guid)
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

  const partsMetaData = [] as Prisma.EmissionFactorPartMetaDataCreateManyInput[]
  await transaction.emissionFactorPart.createMany({
    data: emissionFactorPartsToCreate
      .filter((row) => inconsistentGuids.some(([key]) => key === (row[indexes['GUID']] as string)))
      .map((row) => {
        const id = v4()

        partsMetaData.push({
          language: 'fr',
          title: row[indexes['EF_VAL_LIB']] as string,
          emissionFactorPartId: id,
        })
        return {
          id,
          emissionFactorId: allEmissionFactors.find((ef) => ef.oldBCId === row[indexes['GUID']])?.id as string,
          type: EmissionFactorPartType.Amont,
          oldBCId: row[indexes['EFV_GUID']] as string,
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
          source: row[indexes['Source_Nom']] as string,
          location: row[indexes['NOM_CONTINENT']] as string,
        }
      }),
  })
  await transaction.emissionFactorPartMetaData.createMany({ data: partsMetaData })

  return inconsistentGuids.length > 0
}
