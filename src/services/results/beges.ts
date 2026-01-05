import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { hasDeprecationPeriod } from '@/utils/study'
import { EmissionSourceCaracterisation, ExportRule } from '@prisma/client'
import { computeResult, EmissionFactor, EmissionSource, getEmissionTotal, PostInfos } from './exports'

const allRules = [
  '1.1',
  '1.2',
  '1.3',
  '1.4',
  '1.5',
  '2.1',
  '2.2',
  '3.1',
  '3.2',
  '3.3',
  '3.4',
  '3.5',
  '4.1',
  '4.2',
  '4.3',
  '4.4',
  '4.5',
  '5.1',
  '5.2',
  '5.3',
  '5.4',
  '6.1',
]

export const rulesSpans: Record<string, number> = {
  '1': 6,
  '2': 3,
  '3': 6,
  '4': 6,
  '5': 5,
  '6': 2,
  total: 1,
}

const getRulePost = (caracterisation: EmissionSourceCaracterisation | null, rule?: ExportRule) => {
  if (caracterisation === null || !rule) {
    return null
  }

  switch (caracterisation) {
    case EmissionSourceCaracterisation.Operated:
      return rule.operated
    case EmissionSourceCaracterisation.NotOperated:
      return rule.notOperated
    case EmissionSourceCaracterisation.NotOperatedSupported:
      return rule.notOperatedSupported
    case EmissionSourceCaracterisation.NotOperatedNotSupported:
      return rule.notOperatedNotSupported
    case EmissionSourceCaracterisation.OperatedFugitive:
      return rule.operatedFugitive
    case EmissionSourceCaracterisation.OperatedProcedeed:
      return rule.operatedProcedeed
    case EmissionSourceCaracterisation.Rented:
      return rule.rented
    case EmissionSourceCaracterisation.FinalClient:
      return rule.finalClient
    case EmissionSourceCaracterisation.Held:
      return rule.held
    case EmissionSourceCaracterisation.NotHeldSimpleRent:
      return rule.notHeldSimpleRent
    case EmissionSourceCaracterisation.NotHeldOther:
      return rule.notHeldOther
    case EmissionSourceCaracterisation.HeldProcedeed:
      return rule.heldProcedeed
    case EmissionSourceCaracterisation.HeldFugitive:
      return rule.heldFugitive
    case EmissionSourceCaracterisation.NotHeldSupported:
      return rule.notHeldSupported
    case EmissionSourceCaracterisation.NotHeldNotSupported:
      return rule.notHeldNotSupported
    case EmissionSourceCaracterisation.UsedByIntermediary:
      return rule.usedByIntermediary
  }
}

export const getBegesEmissionValue = (emissionSource: EmissionSource): number => {
  if (!emissionSource.value) {
    return 0
  }

  let value = emissionSource.value
  if (hasDeprecationPeriod(emissionSource.subPost) && emissionSource.depreciationPeriod) {
    value = value / emissionSource.depreciationPeriod
  }
  return value
}

export const getBegesEmissionTotal = (emissionSource: EmissionSource, emissionFactor: EmissionFactor) =>
  getEmissionTotal(emissionSource, emissionFactor, getBegesEmissionValue)

export const computeBegesResult = (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
): PostInfos[] =>
  computeResult(
    study,
    rules,
    emissionFactorsWithParts,
    studySite,
    withDependencies,
    validatedOnly,
    allRules,
    getBegesEmissionValue,
    getRulePost,
  )
