'use server'

import { findEmissionFactorByImportedId } from '@/db/emissionFactors'
import {
  getAnswerByQuestionId,
  getAnswersByStudyAndSubPost,
  getQuestionByIdIntern,
  getQuestionsBySubPost,
  saveAnswer,
} from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

export const saveAnswerForQuestion = async (
  question: Question,
  response: Prisma.InputJsonValue,
  studyId: string,
  studySiteId: string,
  emissionSourceId?: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const { emissionFactorImportedId, depreciationPeriod, previousQuestionInternId } = getEmissionFactorByIdIntern(
      question.idIntern,
    )
    let emissionFactorId = undefined

    if (!emissionFactorImportedId && !depreciationPeriod) {
      return saveAnswer(question.id, studySiteId, response, emissionSourceId)
    }

    if (previousQuestionInternId) {
      const previousQuestion = await getQuestionByIdIntern(previousQuestionInternId)
      if (!previousQuestion) {
        throw new Error(`Previous question not found for idIntern: ${previousQuestionInternId}`)
      }

      const previousAnswer = await getAnswerByQuestionId(previousQuestion.id)
      emissionSourceId = previousAnswer?.emissionSourceId ?? undefined
    }

    if (emissionFactorImportedId) {
      const emissionFactor = await findEmissionFactorByImportedId(emissionFactorImportedId)
      if (!emissionFactor) {
        throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
      }
      emissionFactorId = emissionFactor.id
    }

    const value = depreciationPeriod ? undefined : Number(response)

    if (emissionSourceId) {
      console.log('Updating existing emission source with id:', emissionSourceId)
      console.log('Updating existing emission source with depreciationPeriod:', depreciationPeriod)
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
      }
    }

    console.log('Saving answer for question:', question.id, 'with emissionSourceId:', emissionSourceId)

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
  // Fonctionnement	Bâtiment
  'quelle-est-la-surface-plancher-du-cinema': { emissionFactorImportedId: '20730' },
  'quand-le-batiment-a-t-il-ete-construit': {
    emissionFactorImportedId: '20730',
    depreciationPeriod: 50,
    previousQuestionInternId: 'quelle-est-la-surface-plancher-du-cinema',
  },
  'a-quand-remonte-la-derniere-renovation-importante': {
    emissionFactorImportedId: '20730',
    depreciationPeriod: 10,
    previousQuestionInternId: 'quelle-est-la-surface-plancher-du-cinema',
  },
  'dans-le-cas-d-un-agrandissement-quelle-est-la-surface-supplementaire-ajoutee': { emissionFactorImportedId: '20730' },

  // Fonctionnement	Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  gaz: { emissionFactorImportedId: '37138' },
  fuel: { emissionFactorImportedId: '14086' },
  'bois-granules': { emissionFactorImportedId: '34942' },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },

  // Fonctionnement Activités de bureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  'quel-montant-avez-vous-depense-en-services': { emissionFactorImportedId: '43545' },
  'ordinateurs-fixes': { emissionFactorImportedId: '27003' },
  'ordinateurs-portables': { emissionFactorImportedId: '27002' },
  photocopieurs: { emissionFactorImportedId: '20591' },
  imprimantes: { emissionFactorImportedId: '27027' },
  'telephones-fixes': { emissionFactorImportedId: '20614' },
  'telephones-portables': { emissionFactorImportedId: '27010' },
  tablettes: { emissionFactorImportedId: '27007' },

  // Confiseries et boissons Electroménager
  refrigerateurs: { emissionFactorImportedId: '26976' },
  congelateurs: { emissionFactorImportedId: '26978' },
  warmers: { emissionFactorImportedId: '26986' },
  'distributeurs-snacks-boisson': { emissionFactorImportedId: '26976' },

  // Déchets ordinaires
  'frequence-de-ramassage-par-semaine': { emissionFactorImportedId: '34654' },
  'frequence-de-ramassage-par-semaine-emballage': { emissionFactorImportedId: '34486' },
  'frequence-de-ramassage-par-semaine-biodechets': { emissionFactorImportedId: '22040' },

  // Déchets exceptionnels
  'quelle-quantite-de-materiel-technique-jetez-vous-par-an': { emissionFactorImportedId: '34620' },

  // Billetterie et communication Matériel distributeurs
  'affiches-120x160': { emissionFactorImportedId: '0,31218' },
  'affiches-40x60': { emissionFactorImportedId: '0,038313' },
  'plv-comptoir': { emissionFactorImportedId: '0,195' },
  'plv-grand-format': { emissionFactorImportedId: '1,365' },
  goodies: { emissionFactorImportedId: '0,231' },
  'autres-ex-dossiers-pedagogiques-etc': { emissionFactorImportedId: '0,007095' },

  // Billetterie et communication Matériel cinéma
  programme: { emissionFactorImportedId: '0,007095' },
  affiches: { emissionFactorImportedId: '0,038313' },
  flyers: { emissionFactorImportedId: '0,0059598' },

  // Billetterie et communication Communication digitale
  'combien-de-newsletters-ont-ete-envoyees': { emissionFactorImportedId: '0,00471' },
  'combien-de-caissons-d-affichage-dynamique-sont-presents-dans-le-cinema': { emissionFactorImportedId: '892,25' },
  'combien-d-ecrans-se-trouvent-dans-les-espaces-de-circulation': { emissionFactorImportedId: '27006' },
  'le-cinema-dispose-t-il-d-un-affichage-exterieur-si-oui-quelle-surface': { emissionFactorImportedId: '379' },

  // Billetterie et communication Caisses et bornes
  'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema': { emissionFactorImportedId: '495,41' },
  'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema': { emissionFactorImportedId: '69,07' },

  // Salles et cabines Matériel technique
  serveur: { emissionFactorImportedId: '20894' },
  'baies-de-disques': { emissionFactorImportedId: '20893' },

  // Salles et cabines Communication digitale
  'ecrans-tv': { emissionFactorImportedId: '27006' },

  // Salles et cabines Autre matériel
  'lunettes-3d': { emissionFactorImportedId: '1,31' },
  'disques-durs': { emissionFactorImportedId: '200' },

  // Déchets exceptionnels
  'quelle-quantite-de-lampes-xenon-jetez-vous-par-an': { emissionFactorImportedId: '50' },
}
