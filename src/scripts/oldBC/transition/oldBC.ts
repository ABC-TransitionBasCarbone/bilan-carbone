import { prismaClient } from '../../../db/client'
import { uploadEmissionFactors } from './emissionFactors'
import { OldNewPostAndSubPostsMapping } from './newPostAndSubPosts'
import { OldBCWorkSheetsReader } from './oldBCWorkSheetsReader'
import { uploadOrganizations } from './organizations'
import { uploadStudies } from './studies'

export const uploadOldBCInformations = async (file: string, email: string, organizationId: string) => {
  const postAndSubPostsOldNewMapping = new OldNewPostAndSubPostsMapping()

  const user = await prismaClient.user.findUnique({ where: { email } })
  if (!user || user.organizationId !== organizationId) {
    console.log("L'utilisateur n'existe pas ou n'appartient pas à l'organisation spécifiée")
    return
  }
  const userOrganization = await prismaClient.organization.findUnique({ where: { id: user.organizationId } })
  if (!userOrganization) {
    throw new Error(`L'organisation de l'utilisateur n'existe pas.`)
  }

  const oldBCWorksheetsReader = new OldBCWorkSheetsReader(file)

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  let hasStudiesWarning = false
  await prismaClient.$transaction(async (transaction) => {
    hasOrganizationsWarning = await uploadOrganizations(
      transaction,
      oldBCWorksheetsReader.organizationsWorksheet,
      userOrganization,
    )
    hasEmissionFactorsWarning = await uploadEmissionFactors(
      transaction,
      oldBCWorksheetsReader.emissionFactorsWorksheet,
      organizationId,
    )
    hasStudiesWarning = await uploadStudies(
      transaction,
      user.id,
      organizationId,
      postAndSubPostsOldNewMapping,
      oldBCWorksheetsReader,
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
