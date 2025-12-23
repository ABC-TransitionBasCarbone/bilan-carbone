import { OrganizationVersionWithOrganization } from '@/db/organization'
import { unitsMatrix } from '@/services/importEmissionFactor/historyUnits'
import { getEmissionQuality } from '@/services/importEmissionFactor/import'
import { isMonetaryEmissionFactor } from '@/utils/emissionFactors'
import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma, SubPost } from '@prisma/client'
import { v4 } from 'uuid'
import { OldNewPostAndSubPostsMapping } from './newPostAndSubPosts'
import { EmissionFactorRow, EmissionFactorsWorkSheet } from './oldBCWorkSheetsReader'

const getStringValue = (value: string | number) => {
  const stringValue = value ? value.toString() : ''
  return stringValue.toLocaleLowerCase() === 'null' || stringValue.toLocaleLowerCase() === 'undefined'
    ? ''
    : stringValue
}

const mapToSubPost = (newSubPost: string) => {
  const normalizedSubPost = newSubPost
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s,']/g, '')
    .toLowerCase()

  const foundSubPost = Object.values(SubPost).find((subPost) => subPost.toLowerCase() === normalizedSubPost)
  if (foundSubPost) {
    return foundSubPost
  }
  throw new Error(`Sous poste invalide "${newSubPost}"`)
}

const getSubPosts = (
  emissionFactors: EmissionFactorRow[],
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
) => {
  const subPosts: SubPost[] = []

  for (const emissionFactor of emissionFactors) {
    if (
      emissionFactor.domain === 'NULL' ||
      emissionFactor.category === 'NULL' ||
      emissionFactor.subCategory === 'NULL' ||
      emissionFactor.post === 'NULL' ||
      emissionFactor.subPost === 'NULL'
    ) {
      console.log({
        reason: `pas de sous poste pour  ${emissionFactor.EF_VAL_LIB}`,
      })

      return null
    }
    const newPostAndSubPost = postAndSubPostsOldNewMapping.getNewPostAndSubPost({
      domain: emissionFactor.domain as string,
      category: emissionFactor.category as string,
      subCategory: emissionFactor.subCategory as string,
      oldPost: emissionFactor.post as string,
      oldSubPost: emissionFactor.subPost as string,
    })
    let subPost

    try {
      subPosts.push(mapToSubPost(newPostAndSubPost.newSubPost))
    } catch {
      console.log({
        oldPost: `${emissionFactor.domain} ${emissionFactor.category} ${emissionFactor.subCategory} ${emissionFactor.post} ${emissionFactor.subPost}`,
        reason: `Sous poste invalide ${subPost}`,
      })
      return null
    }
  }

  return subPosts
}

export const uploadEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  emissionFactorsWorksheet: EmissionFactorsWorkSheet,
  organizationVersion: OrganizationVersionWithOrganization,
  postAndSubPostsOldNewMapping: OldNewPostAndSubPostsMapping,
) => {
  console.log("Import des facteurs d'émissions...")
  const ids = emissionFactorsWorksheet.getRows().map((row) => row.EFV_GUID as string)
  const existingEmissionFactors = await transaction.emissionFactor.findMany({
    where: { oldBCId: { in: ids }, organizationId: organizationVersion.organizationId },
  })

  if (existingEmissionFactors.length > 0) {
    console.log(`${existingEmissionFactors.length} facteurs d'émissions déjà importés`)
  }

  const metaData = [] as Prisma.EmissionFactorMetaDataCreateManyInput[]
  const emissionFactorsToCreate = emissionFactorsWorksheet
    .getRows()
    .filter((row) => row.EF_TYPE === 'Consolidé')
    .filter((row) => existingEmissionFactors.every((ef) => ef.oldBCId !== row.EFV_GUID))

  console.log(`${emissionFactorsToCreate.length} facteurs d'émissions à importer`)

  const groupedEmissionFactors = emissionFactorsToCreate.reduce(
    (acc, row) => {
      if (acc[row.EFV_GUID]) {
        acc[row.EFV_GUID].push(row)
      } else {
        acc[row.EFV_GUID] = [row]
      }
      return acc
    },
    {} as Record<string, EmissionFactorRow[]>,
  )

  const createdEmissionFactor = await transaction.emissionFactor.createMany({
    data: Object.values(groupedEmissionFactors)
      .map((row) => {
        const ef = row[0]
        const id = v4()
        const unit = unitsMatrix[getStringValue(ef.Unité_Nom)]

        if (!unit) {
          return null
        }

        metaData.push({
          emissionFactorId: id,
          language: 'fr',
          title: getStringValue(ef.EF_VAL_LIB),
          attribute: getStringValue(ef.EF_VAL_CARAC),
          frontiere: getStringValue(ef.EF_VAL_COMPLEMENT),
          comment: `${getStringValue(ef.Commentaires)} ${getStringValue(ef.DateValidité)}`,
          location: `${getStringValue(ef.NOM_PAYS)} ${getStringValue(ef.NOM_REGION)} ${getStringValue(ef.NOM_DEPARTEMENT)}`,
        })

        const isMonetary = isMonetaryEmissionFactor({ unit })

        const subPosts = getSubPosts(row, postAndSubPostsOldNewMapping)

        return {
          id,
          organizationId: organizationVersion.organizationId,
          importedFrom: Import.Manual,
          status: EmissionFactorStatus.Valid,
          oldBCId: getStringValue(ef.EFV_GUID),
          reliability: getEmissionQuality(ef.Incertitude as number),
          technicalRepresentativeness: getEmissionQuality(ef.Incertitude as number),
          geographicRepresentativeness: getEmissionQuality(ef.Incertitude as number),
          temporalRepresentativeness: getEmissionQuality(ef.Incertitude as number),
          completeness: getEmissionQuality(ef.Incertitude as number),
          unit,
          isMonetary,
          totalCo2: ef.Total_CO2e as number,
          co2f: ef.CO2f as number,
          ch4f: ef.CH4f as number,
          ch4b: ef.CH4b as number,
          n2o: ef.N2O as number,
          co2b: ef.CO2b as number,
          sf6: ef.SF6 as number,
          hfc: ef.HFC as number,
          pfc: ef.PFC as number,
          otherGES: (ef.Autre_gaz as number) + (ef.NF3 as number),
          source: getStringValue(ef.Source_Nom),
          location: getStringValue(ef.NOM_CONTINENT),
          ...(subPosts?.length ? { subPosts } : {}),
        }
      })
      .filter((data) => data !== null),
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
    .filter((row) => row.EF_TYPE !== 'Consolidé' && row.EF_TYPE !== 'NULL')
    .filter((row) => existingEmissionFactorParts.every((ef) => ef.oldBCId !== row.EFV_GUID))
    .map((row) => {
      const excelParentFE = emissionFactorsToCreate.find((ef) => ef.GUID === row.GUID && ef.EF_TYPE === 'Consolidé')

      if (!excelParentFE) {
        console.log(" Pas de facteur d'émission parent trouvé pour la partie avec GUID :", row.EF_VAL_LIB, row.EFV_GUID)
        return false
      }

      const bddParentFE = allEmissionFactors.find((ef) => ef.oldBCId === excelParentFE.EFV_GUID)
      return bddParentFE ? { ...row, bddParentFEId: bddParentFE.id } : false
    })
    .filter((row) => !!row)

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
    throw new Error(`${inconsistentGuids.length} facteurs d'émissions avec des parties incohérentes, donc ignorées`)
  }

  const filteredEmissionFactorPartsToCreate = emissionFactorPartsToCreate.filter((row) =>
    inconsistentGuids.every(([key]) => key !== getStringValue(row.GUID)),
  )

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
        emissionFactorId: row.bddParentFEId,
        type: EmissionFactorPartType.Amont,
        oldBCId: getStringValue(row.EFV_GUID),
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
      }
    }),
  })

  console.log(createdEmissionFactorPart.count, 'composantes importées')
  const createdEmissionFactorMetadata = await transaction.emissionFactorPartMetaData.createMany({ data: partsMetaData })

  console.log(createdEmissionFactorMetadata.count, 'métadonnées de composantes importées')

  return inconsistentGuids.length > 0
}
