'use server'

import { findEmissionFactorByImportedId } from '@/db/emissionFactors'
import { getAnswerByQuestionId, getAnswersByStudyAndSubPost, getQuestionByIdIntern, getQuestionsBySubPost, saveAnswer } from '@/db/question'
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

    const { emissionFactorImportedId, depreciationPeriod, previousQuestionInternId } = getEmissionFactorByIdIntern(question.idIntern) || {}

    console.log(`Saving answer for question: ${question.idIntern}, response: ${response}, studySiteId: ${studySiteId}`)
    let emissionFactorId = undefined
    let emissionSourceId = undefined

    if (!emissionFactorImportedId && !depreciationPeriod) {
      return saveAnswer(question.id, studySiteId, response)
    }

    // TODO: gérer d'un autre manière le cas où on a une question précédente
    if (previousQuestionInternId) {
      const previousQuestion = await getQuestionByIdIntern(previousQuestionInternId)
      if (!previousQuestion) {
        throw new Error(`Previous question not found for idIntern: ${previousQuestionInternId}`)
      }

      const previousAnswer = await getAnswerByQuestionId(previousQuestion.id)
      emissionSourceId = previousAnswer?.emissionSourceId ?? undefined
    }

    console.log(`Emission factor imported ID: ${emissionFactorImportedId}, Depreciation period: ${depreciationPeriod}`)

    /**
     * TODO handle depreciation period calculation based on date
     * value = value / emissionSource.depreciationPeriod
     */

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
  /**
   * TODO use date to calculate depreciation period
   * TODO match emissionFactorImportedId with idIntern
   */
  // Batiment
  '10-quelle-est-la-surface-plancher-du-cinema': { emissionFactorImportedId: '20730' },
  '11-quand-le-batiment-a-t-il-ete-construit': { depreciationPeriod: 50, previousQuestionInternId: '10-quelle-est-la-surface-plancher-du-cinema' },
  '12-a-quand-remonte-la-derniere-renovation-importante': { depreciationPeriod: 10, previousQuestionInternId: '10-quelle-est-la-surface-plancher-du-cinema' },
  'de-quel-type-de-renovation-sagi-t-il': {},
  'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee': { emissionFactorImportedId: '20730' },
  'le-batiment-est-il-partage-avec-une-autre-activite': {},
  'quelle-est-la-surface-totale-du-batiment': {},
  'le-cinema-dispose-t-il-dun-parking': {},
  'si-oui-de-combien-de-places': { emissionFactorImportedId: '26008' },
  // Equipe
  '10-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': { emissionFactorImportedId: '20682' },
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
  'reseaux-urbains-chaleurfroid': { emissionFactorImportedId: '' },
  'bois-granules': { emissionFactorImportedId: '34942' },
  'votre-cinema-est-il-equipe-de-la-climatisation': { emissionFactorImportedId: '' },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  // ActivitesDeBureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  'quel-montant-avez-vous-depense-en-services': { emissionFactorImportedId: '43545' },
  'pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': {},
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
  // Mobilité spectateurs
  'avez-vous-deja-realise-une-enquete-mobilite-specteurs': {},
  /** TODO: Liste 1 */
  'si-a-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants': {},
  /***** */
  'si-b-vous-pouvez-ici-telecharger-un-modele-denquete-qui-vous-permettra-de-remplir-dici-quelques-semaines-les-informations-demandees':
    {},
  'si-c-de-quel-type-de-cinema-votre-etablissement-se-rapproche-le-plus': {},
  'vos-spectateurs-sont-ils-majoritairement-des-habitants-locaux-cest-a-dire-residant-a-lannee-dans-les-environs-ou-attirez-vous-aussi-une-part-non-negligeable-de-spectateurs-de-passage-dans-la-region-touristes-notamment':
    {},
  next: {},
  'quel-est-le-profil-auquel-vous-pouvez-identifier-le-plus-votre-cinema': {},
  // Equipes recus
  'combien-d-equipes-de-film-avez-vous-recu-en-*': {},
  'combien-de-nuits': { emissionFactorImportedId: '106' },
  'combien-d-equipes-de-repas': { emissionFactorImportedId: '20682' },
  // Autres matériel et matériel technique
  '10-decrivez-les-differentes-salles-du-cinema': {},
  '11-decrivez-les-differentes-salles-du-cinema': {},
  '12-decrivez-les-differentes-salles-du-cinema': {},
  '13-decrivez-les-differentes-salles-du-cinema': {},
  '14-decrivez-les-differentes-salles-du-cinema': {},
  '15-decrivez-les-differentes-salles-du-cinema': {},
  '16-decrivez-les-differentes-salles-du-cinema': {},
  '10-comment-stockez-vous-les-films': {},
  '11-comment-stockez-vous-les-films': { emissionFactorImportedId: '20894' },
  '12-comment-stockez-vous-les-films': { emissionFactorImportedId: '20893' },
  // TODO: Calcul ?
  'combien-de-films-recevez-vous-en-dématérialise-par-an': {},
  'combiende-films-recevez-vous-sur-dcp-physique-par-an': {},
  'combien-de-donnees-stockez-vous-dans-un-cloud': {},
  '10-de-combien-disposez-vous-de': {},
  '11-de-combien-disposez-vous-de': { emissionFactorImportedId: '139' },
  '12-de-combien-disposez-vous-de': { emissionFactorImportedId: '140' },
  // Achats
  '10-vendez-vous-des-boissons-et-des-confiseries': {},
  '11-vendez-vous-des-boissons-et-des-confiseries': {},
  // Fret
  'quelle-est-la-distance-entre-votre-cinema-et-votre-principal-fournisseur': { emissionFactorImportedId: '28026' },
  // Electromenager
  '11-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': { emissionFactorImportedId: '26976' },
  '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {},
  '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': { emissionFactorImportedId: '26978' },
  '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {},
  '15-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': { emissionFactorImportedId: '26986' },
  '17-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': { emissionFactorImportedId: '26976' },
  '18-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {},
  // DechetsOrdinaires
  '110-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '111-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '112-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '113-veuillez-renseigner-les-dechets-generes-par-semaine': { emissionFactorImportedId: '34654' },
  '120-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '121-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '122-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '123-veuillez-renseigner-les-dechets-generes-par-semaine': { emissionFactorImportedId: '34486' },
  '130-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '131-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '132-veuillez-renseigner-les-dechets-generes-par-semaine': {},
  '133-veuillez-renseigner-les-dechets-generes-par-semaine': { emissionFactorImportedId: '22040' },
  // DechetsExceptionnels
  'quelle-quantite-de-materiel-technique-jetez-vous-par-an': { emissionFactorImportedId: '34620' },
  'quelle-quantite-de-lampes-xenon-jetez-vous-par-an': { emissionFactorImportedId: '107' },
  // MaterielDistributeurs
  '11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '125',
  },
  '12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '126',
  },
  '13-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '127',
  },
  '14-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '128',
  },
  '15-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '129',
  },
  '16-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    emissionFactorImportedId: '130',
  },
  // MaterielCinema
  '11-quelle-quantite-de-materiel-produisez-vous-chaque-mois': { emissionFactorImportedId: '130' },
  '12-quelle-quantite-de-materiel-produisez-vous-chaque-mois': { emissionFactorImportedId: '126' },
  '13-quelle-quantite-de-materiel-produisez-vous-chaque-mois': { emissionFactorImportedId: '133' },
  // CommunicationDigitale
  'combien-de-newsletters-ont-ete-envoyees': { emissionFactorImportedId: '120' },
  'combien-de-caissons-d-affichage-dynamique-sont-presents-dans-le-cinema': { emissionFactorImportedId: '121' },
  'combien-d-ecrans-se-trouvent-dans-les-espaces-de-circulation': { emissionFactorImportedId: '27006' },
  'le-cinema-dispose-t-il-d-un-affichage-exterieur-si-oui-quelle-surface': { emissionFactorImportedId: '122' },
  // CaissesEtBornes
  'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema': { emissionFactorImportedId: '123' },
  'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema': { emissionFactorImportedId: '124' },
  // MaterielTechnique
  serveur: { emissionFactorImportedId: '20894' },
  'baies-de-disques': { emissionFactorImportedId: '20893' },
  // CommunicationDigitale (again)
  'ecrans-tv': { emissionFactorImportedId: '27006' },
}
