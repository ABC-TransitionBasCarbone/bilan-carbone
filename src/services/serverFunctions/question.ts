'use server'

import { findEmissionFactorByImportedId } from '@/db/emissionFactors'
import { getAnswerByQuestionId, getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

export const saveAnswerForQuestion = async (
  question: Question,
  response: Prisma.InputJsonValue,
  studyId: string,
  studySiteId: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const { emissionFactorImportedId, depreciationPeriod } = getEmissionFactorByIdIntern(question.idIntern) || {}
    let emissionFactorId = undefined
    let emissionSourceId = undefined

    if (!emissionFactorImportedId && !depreciationPeriod) {
      return saveAnswer(question.id, studySiteId, response)
    }

    // TODO: A remettre quand on gèrera les sous question, pour le moment il n'y en a pas à priori.
    // if (previousQuestionInternId) {
    //   const previousQuestion = await getQuestionByIdIntern(previousQuestionInternId)
    //   if (!previousQuestion) {
    //     throw new Error(`Previous question not found for idIntern: ${previousQuestionInternId}`)
    //   }

    //   const previousAnswer = await getAnswerByQuestionId(previousQuestion.id)
    //   emissionSourceId = previousAnswer?.emissionSourceId ?? undefined
    // }

    if (emissionFactorImportedId) {
      const emissionFactor = await findEmissionFactorByImportedId(emissionFactorImportedId)
      if (!emissionFactor) {
        throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
      }
      emissionFactorId = emissionFactor.id
    }

    const value = depreciationPeriod ? undefined : Number(response)

    const previousAnswer = await getAnswerByQuestionId(question.id)
    if (previousAnswer && previousAnswer.emissionSourceId) {
      emissionSourceId = previousAnswer.emissionSourceId
    }

    if (emissionSourceId) {
      await updateEmissionSource({
        value,
        emissionSourceId,
        emissionFactorId,
        depreciationPeriod,
      })
    } else {
      const emissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value,
        name: question.idIntern,
        subPost: question.subPost,
        depreciationPeriod,
        emissionFactorId,
      })

      if (emissionSource.success && emissionSource.data) {
        emissionSourceId = emissionSource.data.id
        await updateEmissionSource({ validated: true, emissionSourceId })
      }
    }

    return saveAnswer(question.id, studySiteId, response, emissionSourceId)
  })

export const getQuestionsWithAnswers = async (subPost: SubPost, studySiteId: string) =>
  withServerResponse('getQuestionsWithAnswers', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const [questions, answers] = await Promise.all([
      getQuestionsBySubPost(subPost),
      getAnswersByStudyAndSubPost(studySiteId, subPost),
    ])

    return { questions, answers }
  })

type EmissionFactorInfo = {
  emissionFactorImportedId?: string | undefined
  depreciationPeriod?: number
  previousQuestionInternId?: string
}

const getEmissionFactorByIdIntern = (idIntern: string): EmissionFactorInfo => emissionFactorMap[idIntern]

const emissionFactorMap: Record<string, EmissionFactorInfo> = {
  // Batiment
  '10-quelle-est-la-surface-plancher-du-cinema': { emissionFactorImportedId: '20730' },
  '11-quand-le-batiment-a-t-il-ete-construit': {},
  '12-a-quand-remonte-la-derniere-renovation-importante': {},
  'de-quel-type-de-renovation-sagi-t-il': {},
  'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee': {},
  'le-batiment-est-il-partage-avec-une-autre-activite': {},
  'quelle-est-la-surface-totale-du-batiment': {},
  'le-cinema-dispose-t-il-dun-parking': {},
  'si-oui-de-combien-de-places': {},
  // Equipe
  '10-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  // DeplacementsProfessionnels
  '10-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  // Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  gaz: { emissionFactorImportedId: '37138' },
  fuel: { emissionFactorImportedId: '14086' },
  'bois-granules': { emissionFactorImportedId: '34942' },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  'reseaux-urbains-chaleurfroid': {},
  'votre-cinema-est-il-equipe-de-la-climatisation': {},
  // ActivitesDeBureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  'quel-montant-avez-vous-depense-en-services': { emissionFactorImportedId: '43545' },
  'ordinateurs-fixes-nombre-unite': { emissionFactorImportedId: '27003' },
  'ordinateurs-fixes-annee-ou-nombre-jours': {},
  'ordinateurs-portables-nombre-unite': { emissionFactorImportedId: '27002' },
  'ordinateurs-portables-annee-ou-nombre-jours': {},
  'photocopieurs-nombre-unite': { emissionFactorImportedId: '20591' },
  'photocopieurs-annee-ou-nombre-jours': {},
  'imprimantes-nombre-unite': { emissionFactorImportedId: '27027' },
  'imprimantes-annee-ou-nombre-jours': {},
  'telephones-fixes-nombre-unite': { emissionFactorImportedId: '20614' },
  'telephones-fixes-annee-ou-nombre-jours': {},
  'telephones-portables-nombre-unite': { emissionFactorImportedId: '27010' },
  'telephones-portables-annee-ou-nombre-jours': {},
  'tablettes-nombre-unite': { emissionFactorImportedId: '27007' },
  'tablettes-annee-ou-nombre-jours': {},
  // Electromenager
  refrigerateurs: { emissionFactorImportedId: '26976' },
  congelateurs: { emissionFactorImportedId: '26978' },
  warmers: { emissionFactorImportedId: '26986' },
  'distributeurs-snacks-boisson': { emissionFactorImportedId: '26976' },
  // DechetsOrdinaires
  'frequence-de-ramassage-par-semaine': { emissionFactorImportedId: '34654' },
  'frequence-de-ramassage-par-semaine-emballage': { emissionFactorImportedId: '34486' },
  'frequence-de-ramassage-par-semaine-biodechets': { emissionFactorImportedId: '22040' },
  // DechetsExceptionnels
  'quelle-quantite-de-materiel-technique-jetez-vous-par-an': { emissionFactorImportedId: '34620' },
  'quelle-quantite-de-lampes-xenon-jetez-vous-par-an': { emissionFactorImportedId: '50' },
  // MaterielDistributeurs
  'affiches-120x160': { emissionFactorImportedId: '0,31218' },
  'affiches-40x60': { emissionFactorImportedId: '0,038313' },
  'plv-comptoir': { emissionFactorImportedId: '0,195' },
  'plv-grand-format': { emissionFactorImportedId: '1,365' },
  goodies: { emissionFactorImportedId: '0,231' },
  'autres-ex-dossiers-pedagogiques-etc': { emissionFactorImportedId: '0,007095' },
  // MaterielCinema
  programme: { emissionFactorImportedId: '0,007095' },
  affiches: { emissionFactorImportedId: '0,038313' },
  flyers: { emissionFactorImportedId: '0,0059598' },
  // CommunicationDigitale
  'combien-de-newsletters-ont-ete-envoyees': { emissionFactorImportedId: '0,00471' },
  'combien-de-caissons-d-affichage-dynamique-sont-presents-dans-le-cinema': { emissionFactorImportedId: '892,25' },
  'combien-d-ecrans-se-trouvent-dans-les-espaces-de-circulation': { emissionFactorImportedId: '27006' },
  'le-cinema-dispose-t-il-d-un-affichage-exterieur-si-oui-quelle-surface': { emissionFactorImportedId: '379' },
  // CaissesEtBornes
  'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema': { emissionFactorImportedId: '495,41' },
  'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema': { emissionFactorImportedId: '69,07' },
  // MaterielTechnique
  serveur: { emissionFactorImportedId: '20894' },
  'baies-de-disques': { emissionFactorImportedId: '20893' },
  // CommunicationDigitale (again)
  'ecrans-tv': { emissionFactorImportedId: '27006' },
  // AutreMateriel
  'lunettes-3d': { emissionFactorImportedId: '1,31' },
  'disques-durs': { emissionFactorImportedId: '200' },
  // Add the rest as needed...
}
