'use server'

import {
  getSituationByStudySite,
  getSituationsByStudySites,
  getSituationsProgressByStudyIds,
  upsertSituation,
} from '@/db/situation'
import { getStudyById } from '@/db/study'
import { ListLayoutSituations } from '@/lib/publicodes/context'
import { computeProgress } from '@/services/publicodes/questionProgress'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { withServerResponse } from '@/utils/serverResponse'
import type { InputJsonValue } from '@prisma/client/runtime/client'
import { Situation } from 'publicodes'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'

export const loadMappedSituation = async (studyId: string, studySiteId: string, mapping: Record<string, string>) =>
  withServerResponse('loadMappedSituation', async () => {
    const situationRes = await loadSituation(studyId, studySiteId)
    const mappedSituation: Record<string, string | number | boolean> = {}

    if (situationRes.success && situationRes.data && situationRes.data.situation) {
      for (const [situationKey, mappedKey] of Object.entries(mapping)) {
        mappedSituation[mappedKey] = (situationRes.data.situation as Record<string, string | number | boolean>)[
          situationKey
        ]
      }
    }
    return mappedSituation
  })

export const loadSituation = async (studyId: string, studySiteId: string) =>
  withServerResponse('getSituationFromDB', async () => {
    const hasAccess = await hasReadAccessOnStudy(studyId)
    if (!hasAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await getSituationByStudySite(studySiteId)
  })

export const loadSituations = async (studyId: string, studySiteIds: string[], skipAuthCheck = false) =>
  withServerResponse('getSituationsFromDB', async () => {
    // NOTE: we can skip auth check for PDF generation since the token was
    // validated at page level. The authentication is already handled by
    // withPdfAuth.
    if (!skipAuthCheck) {
      const hasAccess = await hasReadAccessOnStudy(studyId)
      if (!hasAccess) {
        throw new Error(NOT_AUTHORIZED)
      }
    }

    return await getSituationsByStudySites(studySiteIds)
  })

export const saveSituation = async (
  studyId: string,
  studySiteId: string,
  situation: Situation<string>,
  listLayoutSituations: ListLayoutSituations<string>,
  modelVersion: string,
  simplifiedEnvironment: SimplifiedEnvironment | null,
) =>
  withServerResponse('saveSituation', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const hasEditAccess = await hasEditAccessOnStudy(studyId, session)
    if (!hasEditAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    const studySite = study?.sites.find((site) => site.id === studySiteId)
    if (!study || !studySite) {
      throw new Error(NOT_AUTHORIZED)
    }

    const { answeredCount, totalCount } = simplifiedEnvironment
      ? computeProgress(simplifiedEnvironment, situation, listLayoutSituations)
      : { answeredCount: 0, totalCount: 0 }

    return await upsertSituation(
      studySiteId,
      situation as InputJsonValue,
      listLayoutSituations as InputJsonValue,
      modelVersion,
      answeredCount,
      totalCount,
    )
  })

export const getSimplifiedStudiesProgress = async (studyIds: string[]) =>
  withServerResponse('getSimplifiedStudiesProgress', async () => {
    const situations = await getSituationsProgressByStudyIds(studyIds)
    const result: Record<string, { answered: number; total: number }> = {}
    for (const id of studyIds) {
      result[id] = { answered: 0, total: 0 }
    }
    for (const situation of situations) {
      const studyId = situation.studySite.studyId
      result[studyId].answered += situation.answeredCount
      result[studyId].total += situation.totalCount
    }
    return result
  })
