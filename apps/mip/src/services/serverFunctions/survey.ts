'use server'

import { createResponse } from '@/db/campaign'
import { getSurveyCampaignForCsvExport, getSurveyCampaignForResults } from '@/db/survey'
import { createMipEngine, getSurveyCategoryKeysFromRawRules, RawRules } from '@/publicodes/mip-engine'
import { dbActualizedAuth } from '@/services/auth'
import { EmissionCategory, EntityFilterResult, SurveyResults } from '@/types/results.types'
import { getEntityFilterDefsFromModel as getEntityFilterDefsFromModelFromUtil } from '@/utils/entityFilter'
import { withServerResponse } from '@/utils/serverResponse'
import {
  buildEntityFilterResults,
  computeAggregatesForSituations,
  createEmptyCategories,
  getSurveyQuestionColumns,
  parseStoredFormState,
  resolveKeyStatsRules,
} from '@/utils/survey'
import { isAdmin } from '@/utils/user'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { buildCsv, sanitizeFileName, serializeCsvValue } from '@abc-transitionbascarbone/utils/csv'
import { Situation } from 'publicodes'

export const getEntityFilterDefsFromModel = async (rules: RawRules) => getEntityFilterDefsFromModelFromUtil(rules)

export const getEntityFilterDefsFromModel = async (
  model: RawRules,
): Promise<Array<{ name: string; value: number }>> => {
  const filtrationRule = model['DT . filtrage'] as Record<string, unknown> | undefined
  const rawSuggestions = filtrationRule?.suggestions

  if (!rawSuggestions || typeof rawSuggestions !== 'object') {
    return []
  }

  return Object.entries(rawSuggestions)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => left.value - right.value)
}

export const createSurveyResponse = async (campaignId: string, answers: string) =>
  withServerResponse('createSurveyResponse', async () => {
    await createResponse({
      answers,
      campaign: { connect: { id: campaignId } },
    })
  })

export const getSurveyResults = async (campaignId: string): Promise<SurveyResults | null> => {
  const session = await dbActualizedAuth()
  if (!session?.user) {
    return null
  }

  const canAccessAllOrganizationCampaigns = isAdmin(session.user.role)
  const canAccessEntityFilter = isAdmin(session.user.role)

  const campaign = await getSurveyCampaignForResults({
    campaignId,
    organizationVersionMipId: session.user.organizationVersionMipId,
    canAccessAllOrganizationCampaigns,
    accountMipId: session.user.accountMipId,
  })

  if (!campaign) {
    return null
  }

  const responses = campaign.responses
  const totalRespondents = responses.length
  const modelRules = campaign.modelCampaign.model as RawRules
  const keyStatsRules = resolveKeyStatsRules(modelRules)
  const categoryKeys = getSurveyCategoryKeysFromRawRules(modelRules)
  const entityFilterDefs = canAccessEntityFilter ? await getEntityFilterDefsFromModel(modelRules) : []

  const emptyCategories: EmissionCategory[] = createEmptyCategories(categoryKeys)

  if (totalRespondents === 0) {
    const emptyEntityFilters: EntityFilterResult[] = [
      { id: 'all', name: 'Tous', totalRespondents: 0, averageFootprint: 0, categories: emptyCategories, keyStats: [] },
      ...entityFilterDefs.map(({ name, value }) => ({
        id: String(value),
        name,
        totalRespondents: 0,
        averageFootprint: 0,
        categories: emptyCategories,
        keyStats: [],
      })),
    ]
    return {
      surveyId: campaignId,
      totalRespondents: 0,
      averageFootprint: 0,
      categories: emptyCategories,
      entities: canAccessEntityFilter ? emptyEntityFilters : [],
      comments: [],
      keyStats: [],
    }
  }

  const engine = createMipEngine(modelRules)
  const situations: Situation<string>[] = responses.map((response) => {
    const formState = parseStoredFormState(response.answers)
    return formState.situation ?? {}
  })

  const { averageFootprint, categories, keyStats } = computeAggregatesForSituations(
    engine,
    situations,
    categoryKeys,
    emptyCategories,
    keyStatsRules,
  )

  return {
    surveyId: campaignId,
    totalRespondents,
    averageFootprint,
    categories,
    entities: canAccessEntityFilter
      ? buildEntityFilterResults(situations, entityFilterDefs, engine, categoryKeys, emptyCategories, keyStatsRules)
      : [],
    comments: [],
    keyStats,
  }
}

export const exportSurveyResponsesToCSV = async (campaignId: string) =>
  withServerResponse('exportSurveyResponsesToCSV', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('exportSurveyResponsesToCSV: unauthorized access', { campaignId })
      throw new Error(NOT_AUTHORIZED)
    }

    const canAccessAllOrganizationCampaigns = isAdmin(session.user.role)

    const campaign = await getSurveyCampaignForCsvExport({
      campaignId,
      organizationVersionMipId: session.user.organizationVersionMipId,
      canAccessAllOrganizationCampaigns,
      accountMipId: session.user.accountMipId,
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const model = (campaign.modelCampaign.organizationVersionMip?.modelCampaign?.model ??
      campaign.modelCampaign.model) as RawRules
    const questionColumns = getSurveyQuestionColumns(model)

    const rows = campaign.responses.map((response, index) => {
      const parsedAnswers = parseStoredFormState(response.answers)
      const situation = (parsedAnswers.situation ?? {}) as Record<string, unknown>

      return [
        String(index + 1),
        response.createdAt.toISOString(),
        ...questionColumns.map((column) => serializeCsvValue(situation[column.ruleName])),
      ]
    })

    const questionHeaderVariableNames = questionColumns.map((column) => column.ruleName)

    const csvContent = buildCsv(['Index reponse', 'Date reponse', ...questionHeaderVariableNames], rows)

    const safeCampaignName = sanitizeFileName(campaign.name)
    return {
      fileName: `${safeCampaignName || 'campagne'}-reponses-utilisateurs.csv`,
      csvContent,
    }
  })
