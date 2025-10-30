import { getAccountByEmailAndOrganizationVersionId } from '@/db/account'
import { prismaClient } from '@/db/client'
import {
  getOrganizationVersionById,
  getOrganizationWithSitesById,
  OrganizationVersionWithOrganization,
} from '@/db/organization'
import { Environment } from '@prisma/client'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { uploadEmissionFactors } from './emissionFactors'
import { OldNewPostAndSubPostsMapping } from './newPostAndSubPosts'
import { OldBCWorkSheetsReader } from './oldBCWorkSheetsReader'
import { uploadOrganizations } from './organizations'
import { uploadStudies } from './studies'

export const uploadOldBCInformations = async (
  file: string,
  email: string,
  organizationVersionId: string,
  skip: boolean,
) => {
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

  const oldBCWorksheetsReader = new OldBCWorkSheetsReader(file)

  let hasOrganizationsWarning = false
  let hasEmissionFactorsWarning = false
  let hasStudiesWarning = false

  if (!skip) {
    const rl = readline.createInterface({ input, output })
    const doWeContinue = await rl.question(
      "Tu n'as pas choisi de passer en mode vérification (pas de paramètre skip), es-tu sûr de vouloir continuer ? (oui/non) ",
    )

    if (doWeContinue?.toLocaleLowerCase() !== 'oui') {
      throw new Error('On arrête le programme')
    } else {
      console.log("C'est parti pour la migration !")
    }
    rl.close()
  }

  await prismaClient.$transaction(
    async (transaction) => {
      hasOrganizationsWarning = await uploadOrganizations(
        transaction,
        oldBCWorksheetsReader.organizationsWorksheet,
        accountOrganizationVersion,
      )
      hasEmissionFactorsWarning = await uploadEmissionFactors(
        transaction,
        oldBCWorksheetsReader.emissionFactorsWorksheet,
        accountOrganizationVersion,
        postAndSubPostsOldNewMapping,
      )
      hasStudiesWarning = await uploadStudies(
        transaction,
        account.id,
        organizationVersionId,
        postAndSubPostsOldNewMapping,
        oldBCWorksheetsReader,
      )

      if (skip) {
        throw Error()
      }
    },
    { timeout: 10000 },
  ) // 10 seconds timeout for the transaction

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
