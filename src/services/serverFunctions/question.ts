'use server'

import { TableAnswer } from '@/components/dynamic-form/types/formTypes'
import { prismaClient } from '@/db/client'
import { getEmissionFactorByImportedIdAndStudiesEmissionSource } from '@/db/emissionFactors'
import {
  getAnswerByQuestionId,
  getAnswersByStudyAndSubPost,
  getQuestionByIdIntern,
  getQuestionsByIdIntern,
  getQuestionsBySubPost,
  saveAnswer,
} from '@/db/question'
import { FullStudy, getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import { isTableAnswer } from '@/utils/tableInput'
import { Prisma, Question, QuestionType, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadStudy } from '../permissions/study'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

const handleTableEmissionSources = async (
  question: Question,
  tableAnswer: TableAnswer,
  studyId: string,
  studySiteId: string,
  study: FullStudy,
) => {
  const emissionSourceIds: string[] = []

  // Get related questions for this table
  const relatedQuestions = await getQuestionsByIdIntern(question.idIntern)

  for (const row of tableAnswer.rows) {
    // For each column in the table, check if it has emission factor mapping
    for (const relatedQuestion of relatedQuestions) {
      const columnValue = row.data[relatedQuestion.idIntern]
      if (!columnValue) {
        continue
      }

      const { emissionFactorImportedId, depreciationPeriod, linkQuestionId } =
        getEmissionFactorByIdIntern(relatedQuestion.idIntern, columnValue) || {}

      if (!emissionFactorImportedId && !depreciationPeriod && !linkQuestionId) {
        continue // Skip columns without emission factor mapping
      }

      let emissionFactorId = undefined

      // Handle linked questions for table rows
      if (linkQuestionId) {
        const linkQuestion = await getQuestionByIdIntern(linkQuestionId)
        if (linkQuestion) {
          // Look for linked question value in the same row
          const linkValue = row.data[linkQuestion.idIntern]
          if (linkValue) {
            const linkEmissionInfo = getEmissionFactorByIdIntern(linkQuestion.idIntern, linkValue)
            if (linkEmissionInfo?.emissionFactorImportedId) {
              const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
                linkEmissionInfo.emissionFactorImportedId,
                study.emissionFactorVersions.map((v) => v.importVersionId),
              )
              if (emissionFactor) {
                emissionFactorId = emissionFactor.id
              }
            }
          }
        }
      } else if (emissionFactorImportedId) {
        const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
          emissionFactorImportedId,
          study.emissionFactorVersions.map((v) => v.importVersionId),
        )
        if (emissionFactor) {
          emissionFactorId = emissionFactor.id
        }
      }

      // Calculate value from column data
      const value = depreciationPeriod ? undefined : Number(columnValue)

      // Create emission source for this table cell/row combination
      const emissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value: isNaN(value as number) ? undefined : value,
        name: `${relatedQuestion.idIntern}-row-${row.index}`,
        subPost: question.subPost,
        depreciationPeriod,
        emissionFactorId,
      })

      if (emissionSource.success && emissionSource.data) {
        emissionSourceIds.push(emissionSource.data.id)
        await updateEmissionSource({ validated: true, emissionSourceId: emissionSource.data.id })
      }
    }
  }

  return emissionSourceIds
}

export const saveAnswerForQuestion = async (
  question: Question,
  response: Prisma.InputJsonValue,
  studyId: string,
  studySiteId: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canReadStudy(session.user, studyId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    const studySite = study?.sites.find((site) => site.id === studySiteId)
    if (!study || !studySite) {
      throw new Error(NOT_AUTHORIZED)
    }

    // Prevent saving to table column questions - data should be saved to the parent TABLE question
    if (await isTableColumnQuestion(question)) {
      throw new Error(
        `Cannot save directly to table column question ${question.idIntern}. Data should be saved to the parent TABLE question.`,
      )
    }

    if (question.type === QuestionType.TABLE) {
      let tableAnswer: TableAnswer

      if (isTableAnswer(response)) {
        tableAnswer = response
      } else {
        tableAnswer = { rows: [] }
      }

      const emissionSourceIds = await handleTableEmissionSources(question, tableAnswer, studyId, studySiteId, study)

      return saveAnswer(question.id, studySiteId, tableAnswer as unknown as Prisma.InputJsonValue, emissionSourceIds[0])
    }

    const { emissionFactorImportedId, depreciationPeriod, linkQuestionId } =
      getEmissionFactorByIdIntern(question.idIntern, response) || {}

    let emissionFactorId = undefined
    let emissionSourceId = undefined

    const value = depreciationPeriod ? undefined : Number(response)

    if (!emissionFactorImportedId && !depreciationPeriod && !linkQuestionId) {
      return saveAnswer(question.id, studySiteId, response)
    }

    if (linkQuestionId) {
      const linkQuestion = await getQuestionByIdIntern(linkQuestionId)
      if (!linkQuestion) {
        throw new Error(`Previous question not found for idIntern: ${linkQuestionId}`)
      }

      const linkAnswer = await getAnswerByQuestionId(linkQuestion.id, studySiteId)
      /**
       * TODO :
       * Sauvegarder dans une seule réponse json les différentes valeurs à multiplier
       * Créer une émissionSource uniquement quand les différentes valeurs sont connues
       */
      emissionSourceId = linkAnswer?.emissionSourceId ?? undefined
    }

    if (emissionFactorImportedId) {
      const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        emissionFactorImportedId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )
      if (!emissionFactor) {
        throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
      }
      emissionFactorId = emissionFactor.id
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
      throw new Error(NOT_AUTHORIZED)
    }

    const [questions, answers] = await Promise.all([
      getQuestionsBySubPost(subPost),
      getAnswersByStudyAndSubPost(studySiteId, subPost),
    ])

    return { questions, answers }
  })

export const getAnswerByQuestionIdAndStudySiteId = async (questionId: string, studySiteId: string) =>
  withServerResponse('getAnswerByQuestionId', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return getAnswerByQuestionId(questionId, studySiteId)
  })

export const getQuestionsFromIdIntern = async (idIntern: string) =>
  withServerResponse('getQuestionsByIdIntern', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return getQuestionsByIdIntern(idIntern)
  })

export const getParentTableQuestion = async (columnQuestionId: string) =>
  withServerResponse('getParentTableQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const columnQuestion = await prismaClient.question.findUnique({
      where: { id: columnQuestionId },
    })

    if (!columnQuestion) {
      throw new Error('Column question not found')
    }

    const relatedQuestions = await getQuestionsByIdIntern(columnQuestion.idIntern)

    const tableQuestion = relatedQuestions.find((q) => q.type === QuestionType.TABLE)

    if (!tableQuestion) {
      throw new Error('Parent TABLE question not found')
    }

    return tableQuestion
  })

const isTableColumnQuestion = async (question: Question): Promise<boolean> => {
  if (question.type === QuestionType.TABLE) {
    return false
  }

  try {
    const relatedQuestions = await getQuestionsByIdIntern(question.idIntern)

    const hasTableQuestion = relatedQuestions.some((q) => q.type === QuestionType.TABLE)

    return hasTableQuestion
  } catch {
    return false
  }
}

type EmissionFactorInfo = {
  emissionFactorImportedId?: string | undefined
  depreciationPeriod?: number
  linkQuestionId?: string
  emissionFactors?: Record<string, string>
}

const getEmissionFactorByIdIntern = (idIntern: string, response: Prisma.InputJsonValue): EmissionFactorInfo => {
  const emissionFactorInfo = emissionFactorMap[idIntern]

  console.log(
    `getEmissionFactorByIdIntern: idIntern=${idIntern}, response=${response}, emissionFactorInfo=`,
    emissionFactorInfo,
  )

  if (emissionFactorInfo && emissionFactorInfo.emissionFactors) {
    if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
      for (const [, value] of Object.entries(response)) {
        if (typeof value === 'string' && emissionFactorInfo.emissionFactors[value]) {
          emissionFactorInfo.emissionFactorImportedId = emissionFactorInfo.emissionFactors[value]
          break
        }
      }
    } else {
      emissionFactorInfo.emissionFactorImportedId = emissionFactorInfo.emissionFactors[response.toString()]
    }
  }

  return emissionFactorInfo
}

const emissionFactorMap: Record<string, EmissionFactorInfo> = {
  /**
   * TODO use date to calculate depreciation period
   * TODO match emissionFactorImportedId with idIntern
   */
  // Batiment
  '10-quelle-est-la-surface-plancher-du-cinema': {
    emissionFactorImportedId: '20730',
    linkQuestionId: '11-quand-le-batiment-a-t-il-ete-construit',
  },
  '11-quand-le-batiment-a-t-il-ete-construit': {
    depreciationPeriod: 50,
    linkQuestionId: '10-quelle-est-la-surface-plancher-du-cinema',
  },
  '12-a-quand-remonte-la-derniere-renovation-importante': {
    depreciationPeriod: 10,
    linkQuestionId: 'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee',
  },
  'de-quel-type-de-renovation-sagi-t-il': {},
  'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee': {
    emissionFactorImportedId: '20730',
    linkQuestionId: '12-a-quand-remonte-la-derniere-renovation-importante',
  },
  'le-batiment-est-il-partage-avec-une-autre-activite': {},
  'quelle-est-la-surface-totale-du-batiment': {},
  'le-cinema-dispose-t-il-dun-parking': {},
  'si-oui-de-combien-de-places': { emissionFactorImportedId: '26008', depreciationPeriod: 50 },
  // Equipe - attente de la fonctionnalité table
  '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': { emissionFactorImportedId: '20682' },
  '12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {
    emissionFactors: {
      'Métro (Ile de France)': '43253',
      'RER et Transilien (Ile-de-France)': '43254',
      'Métro, tramway (agglomérations de 100 000 à 250 000 habitants)': '28150',
      'Métro, tramway (agglomérations de + de 250 000 habitants)': '28151',
      'Bus (agglomérations de - de 100 000 habitants)': '27998',
      'Bus (agglomérations de 100 000 à 250 000 habitants)': '27999',
      'Bus (agglomérations de + de 250 000 habitants)': '28000',
      'Vélo à assistance éléctrique': '28331',
      'Vélo classique': '134',
      Marche: '135',
      'Voiture gazole courte distance': '27984',
      'Voiture essence courte distance': '27983',
      'Voiture particulière/Entrée de gamme - Véhicule léger/Hybride rechargeable avec alimentation auxiliaire de puissance':
        '28015',
      'Voiture particulière/Entrée de gamme - Véhicule léger/Electrique': '28013',
      'Moto >250cm3 /Mixte': '27995',
      'Moto<250cm3/Mixte': '27992',
      'Trottinette électrique': '28329',
    },
  },
  // DeplacementsProfessionnels - attente de la fonctionnalité table
  '11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {
    emissionFactors: {
      'tous types d’hôtel': '100',
      'hôtel 1*': '101',
      'hôtel 2*': '102',
      'hôtel 3*': '103',
      'hôtel 4*': '104',
      'hôtel 5*': '105',
      nuitée: '106',
    },
  },
  '17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  // Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  gaz: { emissionFactorImportedId: '37138' },
  fuel: { emissionFactorImportedId: '14086' },
  'reseaux-urbains-chaleurfroid': { emissionFactorImportedId: '' }, // Attente d'une fonctionnalité pour gérer les départements
  'bois-granules': { emissionFactorImportedId: '34942' },
  'votre-cinema-est-il-equipe-de-la-climatisation': { emissionFactorImportedId: '' },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  // ActivitesDeBureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  'quel-montant-avez-vous-depense-en-services': { emissionFactorImportedId: '43545' },
  'ordinateurs-fixes-nombre-unite': {
    emissionFactorImportedId: '27003',
    linkQuestionId: 'ordinateurs-fixes-annee-ou-nombre-jours',
  },
  'ordinateurs-fixes-annee-ou-nombre-jours': {
    depreciationPeriod: 4,
    linkQuestionId: 'ordinateurs-fixes-nombre-unite',
  },
  'ordinateurs-portables-nombre-unite': {
    emissionFactorImportedId: '27002',
    linkQuestionId: 'ordinateurs-portables-annee-ou-nombre-jours',
  },
  'ordinateurs-portables-annee-ou-nombre-jours': {
    depreciationPeriod: 4,
    linkQuestionId: 'ordinateurs-portables-nombre-unite',
  },
  'photocopieurs-nombre-unite': {
    emissionFactorImportedId: '20591',
    linkQuestionId: 'photocopieurs-annee-ou-nombre-jours',
  },
  'photocopieurs-annee-ou-nombre-jours': { depreciationPeriod: 4, linkQuestionId: 'photocopieurs-nombre-unite' },
  'imprimantes-nombre-unite': {
    emissionFactorImportedId: '27027',
    linkQuestionId: 'imprimantes-annee-ou-nombre-jours',
  },
  'imprimantes-annee-ou-nombre-jours': { depreciationPeriod: 4, linkQuestionId: 'imprimantes-nombre-unite' },
  'telephones-fixes-nombre-unite': {
    emissionFactorImportedId: '20614',
    linkQuestionId: 'telephones-fixes-annee-ou-nombre-jours',
  },
  'telephones-fixes-annee-ou-nombre-jours': { depreciationPeriod: 4, linkQuestionId: 'telephones-fixes-nombre-unite' },
  'telephones-portables-nombre-unite': {
    emissionFactorImportedId: '27010',
    linkQuestionId: 'telephones-portables-annee-ou-nombre-jours',
  },
  'telephones-portables-annee-ou-nombre-jours': {
    depreciationPeriod: 4,
    linkQuestionId: 'telephones-portables-nombre-unite',
  },
  'tablettes-nombre-unite': { emissionFactorImportedId: '27007', linkQuestionId: 'tablettes-annee-ou-nombre-jours' },
  'tablettes-annee-ou-nombre-jours': { depreciationPeriod: 4, linkQuestionId: 'tablettes-nombre-unite' },
  // Mobilité spectateurs
  'avez-vous-deja-realise-une-enquete-mobilite-specteurs': {},
  /** TODO: Liste 1  - attente de la fonctionnalité liste */
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
  // Autres matériel et matériel technique - Attente de la fonctionnalité table
  '11-decrivez-les-differentes-salles-du-cinema': {
    // TODO multiplier par le nombre de salles ou faire un tableau
    emissionFactors: {
      'Projecteur Xénon': '107',
      'Projecteur Laser': '108',
      'Projecteur 35 mm': '109',
    },
  },
  '12-decrivez-les-differentes-salles-du-cinema': {
    // TODO multiplier par le nombre d'écrans
    emissionFactors: {
      'Ecran 2D': '110',
      'Ecran 3D': '111',
    },
    linkQuestionId: '13-Décrivez les différentes salles du cinéma',
  },
  '13-decrivez-les-differentes-salles-du-cinema': {
    linkQuestionId: '12-Décrivez les différentes salles du cinéma',
  },
  '14-decrivez-les-differentes-salles-du-cinema': {
    emissionFactors: {
      'Fauteuils classiques': '112',
      'Fauteuils 4DX': '113',
    },
    linkQuestionId: '15-Décrivez les différentes salles du cinéma',
  },
  '15-decrivez-les-differentes-salles-du-cinema': {
    linkQuestionId: '14-Décrivez les différentes salles du cinéma',
  },
  '16-decrivez-les-differentes-salles-du-cinema': {
    // TODO multiplier par le nombre de salles
    emissionFactors: {
      'Son Stéréo': '114',
      'Dolby 5.1': '115',
      'Dolby 7.1': '116',
      'Dolby Atmos': '117',
      IMAX: '118',
      'Auro 3D / Ice': '119',
      'DTS : X': '120',
      THX: '121',
    },
  },
  '11-comment-stockez-vous-les-films': { emissionFactorImportedId: '20894' },
  '12-comment-stockez-vous-les-films': { emissionFactorImportedId: '20893' },
  'combien-de-films-recevez-vous-en-dématérialise-par-an': { emissionFactorImportedId: '141' },
  'combiende-films-recevez-vous-sur-dcp-physique-par-an': {}, // TODO: Calcul ?
  'combien-de-donnees-stockez-vous-dans-un-cloud': { emissionFactorImportedId: '142' },
  '11-de-combien-disposez-vous-de': { emissionFactorImportedId: '139' },
  '12-de-combien-disposez-vous-de': { emissionFactorImportedId: '140' },
  // Achats
  '11-vendez-vous-des-boissons-et-des-confiseries': {
    emissionFactors: {
      // TODO trouver une manière de mulitplier par le nombre de séances
      'Un peu de confiseries et de boissons (~30g)': '136',
      'Une part standard de confiseries et de boissons (~120g)': '137',
      'Une part significative de confiseries et de boissons (~200g)': '138',
    },
  },
  // Fret
  'quelle-est-la-distance-entre-votre-cinema-et-votre-principal-fournisseur': { emissionFactorImportedId: '28026' },
  // Electromenager
  '11-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    emissionFactorImportedId: '26976',
    linkQuestionId: '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    depreciationPeriod: 5,
    linkQuestionId: '11-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    emissionFactorImportedId: '26978',
    linkQuestionId: '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    depreciationPeriod: 5,
    linkQuestionId: '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '15-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    emissionFactorImportedId: '26986',
    linkQuestionId: '16-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '16-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    depreciationPeriod: 5,
    linkQuestionId: '15-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '17-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    emissionFactorImportedId: '26976',
    linkQuestionId: '18-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  '18-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    depreciationPeriod: 5,
    linkQuestionId: '17-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
  },
  // DechetsOrdinaires
  '111-veuillez-renseigner-les-dechets-generes-par-semaine': {
    linkQuestionId: '112-veuillez-renseigner-les-dechets-generes-par-semaine',
  }, // Nombre des bennes
  '112-veuillez-renseigner-les-dechets-generes-par-semaine': {
    linkQuestionId: '113-veuillez-renseigner-les-dechets-generes-par-semaine',
  }, // Taille des bennes
  '113-veuillez-renseigner-les-dechets-generes-par-semaine': {
    emissionFactorImportedId: '34654',
    linkQuestionId: '111-veuillez-renseigner-les-dechets-generes-par-semaine',
  }, // Fréquence de ramassage (par semaine) Ordures ménagères
  '121-veuillez-renseigner-les-dechets-generes-par-semaine': {}, // Nombre des bennes
  '122-veuillez-renseigner-les-dechets-generes-par-semaine': {}, // Taille des bennes
  '123-veuillez-renseigner-les-dechets-generes-par-semaine': { emissionFactorImportedId: '34486' }, // Fréquence de ramassage (par semaine) Emballages et papier
  '131-veuillez-renseigner-les-dechets-generes-par-semaine': {}, // Nombre des bennes
  '132-veuillez-renseigner-les-dechets-generes-par-semaine': {}, // Taille des bennes
  '133-veuillez-renseigner-les-dechets-generes-par-semaine': { emissionFactorImportedId: '22040' }, // Fréquence de ramassage (par semaine) Biodéchets
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
