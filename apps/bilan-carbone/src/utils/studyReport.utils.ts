import { isOrganizationVersionCR } from '@/db/organization'
import { getEngagementActions, type FullStudy } from '@/db/study'
import { getActions, getTransitionPlanByStudyId } from '@/db/transitionPlan'
import { getLocale } from '@/i18n/locale'
import { formatNumber } from '@/utils/number'
import { getPostsFromSubPosts } from '@/utils/post'
import { getBcTranslations } from '@/utils/translation.utils'
import { Level, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { formatDateFr } from '@abc-transitionbascarbone/utils'
import { getTranslations } from 'next-intl/server'

export const mapStudyForReport = async (
  study: FullStudy,
  results: {
    monetaryRatio: number
    nonSpecificMonetaryRatio: number
  },
) => {
  const isParentCR = !!(
    study.organizationVersion.parentId && (await isOrganizationVersionCR(study.organizationVersion.parentId))
  )

  const locale = await getLocale()
  const bc = getBcTranslations(locale)

  const allowedUsers = study.allowedUsers.map((user) => {
    const { firstName, lastName } = user.account.user
    return {
      accountId: user.accountId,
      name: `${firstName} ${lastName}`,
      role: user.role,
      createdAt: user.createdAt,
      isInternal: isParentCR
        ? user.account.organizationVersionId !== study.organizationVersion.parentId
        : user.account.organizationVersionId === study.organizationVersionId,
      isExternal: isParentCR
        ? user.account.organizationVersionId === study.organizationVersion.parentId
        : user.account.organizationVersionId !== study.organizationVersionId,
    }
  })

  const contributors: { accountId: string; name: string; isInternal: boolean; isExternal: boolean }[] = []
  study.contributors.forEach((contributor) => {
    if (!contributors.some((c) => c.accountId === contributor.accountId)) {
      const { firstName, lastName } = contributor.account.user
      contributors.push({
        accountId: contributor.accountId,
        name: `${firstName} ${lastName}`,
        isInternal: isParentCR
          ? contributor.account.organizationVersionId !== study.organizationVersion.parentId
          : false,
        isExternal: false,
      })
    }
  })

  const admin =
    allowedUsers
      .filter((user) => user.role === StudyRole.Validator)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] || null
  const remainingMembers = allowedUsers.filter((user) => user.accountId !== admin?.accountId)
  const internalTeam = [
    ...remainingMembers.filter((user) => user.isInternal),
    ...contributors.filter((contributor) => contributor.isInternal),
  ]
  const externalTeam = [
    ...remainingMembers.filter((user) => user.isExternal),
    ...contributors.filter((contributor) => contributor.isExternal),
    ...(admin?.isExternal ? [admin] : []),
  ]

  const sites = study.sites.map((studySite) => ({
    id: studySite.id,
    name: studySite.site.name,
    city: studySite.site.city,
    postalCode: studySite.site.postalCode,
  }))

  const engagementActionsRaw = await getEngagementActions(study.id)
  const engagementActions = engagementActionsRaw.map((ea) => ({
    name: ea.name,
    targets: ea.targets.map((t) => (bc.study.engagementActions.targets as Record<string, string>)[t] ?? t).join(', '),
    steps: (bc.study.engagementActions.steps as Record<string, string>)[ea.steps] ?? ea.steps,
    phase: (bc.study.engagementActions.phases as Record<string, string>)[ea.phase] ?? ea.phase,
    description: ea.description,
  }))

  const transitionPlan = await getTransitionPlanByStudyId(study.id)
  const actions = transitionPlan
    ? (await getActions(transitionPlan.id)).map((action) => ({
        title: action.title,
        posts:
          action.subPosts.length === 0
            ? bc.emissionFactors.post.allPost
            : getPostsFromSubPosts(action.subPosts.map((sp) => sp.subPost))
                .map((p) => (bc.emissionFactors.post as unknown as Record<string, string>)[p] ?? p)
                .join(', '),
        category: action.category
          .map((c) => (bc.study.transitionPlan.actions.category as Record<string, string>)[c] ?? c)
          .join(', '),
        necessaryBudget: action.necessaryBudget ?? null,
        reductionStartYear: action.reductionStartYear ? action.reductionStartYear.slice(0, 4) : null,
        reductionValueTCO2e: action.reductionValueKg != null ? Math.round(action.reductionValueKg / 1000) : null,
        potentialDeduction:
          (bc.study.transitionPlan.actions.potentialDeduction as Record<string, string>)[action.potentialDeduction] ??
          action.potentialDeduction,
      }))
    : []

  const monetaryRatioPercentage = formatNumber(results.monetaryRatio, 2)
  const nonSpecificMonetaryRatioPercentage = formatNumber(results.nonSpecificMonetaryRatio, 2)
  const specificMonetaryRatioPercentage = formatNumber(results.monetaryRatio - results.nonSpecificMonetaryRatio, 2)

  const tLevel = await getTranslations('level')

  return {
    ...study,
    siret: study.organizationVersion.organization.wordpressId,
    level: tLevel(study.level),
    isInitialOrStandard: study.level === Level.Initial || study.level === Level.Standard,
    isStandardOrAdvanced: study.level === Level.Standard || study.level === Level.Advanced,
    isInitial: study.level === Level.Initial,
    isStandard: study.level === Level.Standard,
    isAdvanced: study.level === Level.Advanced,
    year: study.startDate.getFullYear(),
    startDate: formatDateFr(study.startDate),
    endDate: formatDateFr(study.endDate),
    admin,
    internalTeam,
    externalTeam,
    monetaryRatioPercentage,
    specificMonetaryRatioPercentage,
    nonSpecificMonetaryRatioPercentage,
    sites,
    totalEtp: study.sites.length > 0 ? study.sites.reduce((sum, s) => sum + s.etp, 0) : '',
    exportTypesList: (study.exports?.types ?? [])
      .map((type) => (bc.exports as unknown as Record<string, string>)[type] ?? type)
      .join(', '),
    engagementActions,
    actions,
  }
}
