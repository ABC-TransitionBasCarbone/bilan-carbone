'use server'

import { getSituationByStudySite, getSituationsByStudySites, upsertSituation } from '@/db/situation'
import { getStudyById } from '@/db/study'
import { ListLayoutSituations } from '@/lib/publicodes/context'
import { withServerResponse } from '@/utils/serverResponse'
import type { InputJsonValue } from '@prisma/client/runtime/client'
import { Situation } from 'publicodes'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canSaveSituationOnStudy } from '../permissions/situation'
import { hasReadAccessOnStudy } from '../permissions/study'

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
      console.error('loadSituation: user not authorized', studyId)
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
        console.error('loadSituations: user not authorized', studyId)
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
) =>
  withServerResponse('saveSituation', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      console.error('saveSituation: no session', studyId)
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    const studySite = study?.sites.find((site) => site.id === studySiteId)
    if (!study || !studySite) {
      console.error('saveSituation: study or studySite not found', studyId, studySiteId)
      throw new Error(NOT_AUTHORIZED)
    }

    const canSaveSituation = await canSaveSituationOnStudy(studyId, study, session)
    if (!canSaveSituation) {
      console.error('saveSituation: user not authorized', session.user.accountId, studyId)
      throw new Error(NOT_AUTHORIZED)
    }

    return await upsertSituation(
      studySiteId,
      situation as InputJsonValue,
      listLayoutSituations as InputJsonValue,
      modelVersion,
    )
  })
