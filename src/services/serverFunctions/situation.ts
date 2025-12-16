'use server'

import { getSituationByStudySite, upsertSituation } from '@/db/situation'
import { getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { Situation } from 'publicodes'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasEditAccessOnStudy, hasReadAccessOnStudy } from '../permissions/study'

export const loadSituation = async (studyId: string, studySiteId: string) =>
  withServerResponse('getSituationFromDB', async () => {
    const hasAccess = await hasReadAccessOnStudy(studyId)
    if (!hasAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await getSituationByStudySite(studySiteId)
  })

export const saveSituation = async (
  studyId: string,
  studySiteId: string,
  situation: Situation<string>,
  modelVersion: string,
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

    return await upsertSituation(studySiteId, situation as InputJsonValue, modelVersion)
  })
