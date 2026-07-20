'use server'

import { CATEGORY_COLORS } from '@/data/sampleResults'
import { createResponse } from '@/db/campaign'
import { getCampaignWithModelForSurvey, getResponsesByCampaignId } from '@/db/survey'
import { createMipEngine, RawRules } from '@/publicodes/mip-engine'
import { EmissionCategory, SurveyResults } from '@/types/results.types'
import { withServerResponse } from '@/utils/serverResponse'
import { Situation } from 'publicodes'

const CATEGORY_MAP = [
  { key: 'commute', rule: 'DT' },
  { key: 'travel', rule: 'transport' },
  { key: 'food', rule: 'alimentation' },
  { key: 'digital', rule: 'divers' },
  { key: 'office', rule: 'logement' },
] as const

export const createSurveyResponse = async (campaignId: string, answers: string) =>
  withServerResponse('createSurveyResponse', async () => {
    await createResponse({
      answers,
      campaign: { connect: { id: campaignId } },
    })
  })

export const getSurveyResults = async (campaignId: string): Promise<SurveyResults | null> => {
  const campaign = await getCampaignWithModelForSurvey(campaignId)
  if (!campaign) return null

  const responses = await getResponsesByCampaignId(campaignId)
  const totalRespondents = responses.length

  const emptyCategories: EmissionCategory[] = CATEGORY_MAP.map(({ key }) => ({
    key,
    labelFr: '',
    value: 0,
    color: CATEGORY_COLORS[key],
  }))

  if (totalRespondents === 0) {
    return {
      surveyId: campaignId,
      totalRespondents: 0,
      averageFootprint: 0,
      categories: emptyCategories,
      entities: [{ id: 'all', name: 'Tous' }],
      comments: [],
      keyStats: [],
    }
  }

  const engine = createMipEngine(campaign.modelCampaign.model as RawRules)
  const categoryTotals: Record<string, number> = Object.fromEntries(CATEGORY_MAP.map(({ key }) => [key, 0]))
  let footprintTotal = 0

  for (const response of responses) {
    const formState = response.answers as { situation?: Situation<string> }
    engine.setSituation(formState.situation ?? {})

    const bilanValue = engine.evaluate('bilan').nodeValue
    footprintTotal += typeof bilanValue === 'number' ? bilanValue : 0

    for (const { key, rule } of CATEGORY_MAP) {
      const value = engine.evaluate(rule).nodeValue
      categoryTotals[key] += typeof value === 'number' ? value : 0
    }
  }

  return {
    surveyId: campaignId,
    totalRespondents,
    averageFootprint: Math.round(footprintTotal / totalRespondents),
    categories: CATEGORY_MAP.map(({ key }) => ({
      key,
      labelFr: '',
      value: Math.round(categoryTotals[key] / totalRespondents),
      color: CATEGORY_COLORS[key],
    })),
    entities: [{ id: 'all', name: 'Tous' }],
    comments: [],
    keyStats: [],
  }
}
