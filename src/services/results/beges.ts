import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { hasDeprecationPeriod } from '@/utils/study'
import { ExportRule } from '@prisma/client'
import { computeResult, EmissionSource, ExportEmissionFactor, getEmissionTotal, PostInfos } from './exports'

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

const getLine = (value: number, EFOrEFPart: ExportEmissionFactor): Omit<PostInfos, 'rule' | 'uncertainty'> => {
  const ch4 = EFOrEFPart.ch4f || 0
  const n2o = EFOrEFPart.n2o || 0
  const other = (EFOrEFPart.otherGES || 0) + (EFOrEFPart.pfc || 0) + (EFOrEFPart.hfc || 0) + (EFOrEFPart.sf6 || 0)
  const totalOtherGas = ch4 + n2o + other

  const co2 = (EFOrEFPart.totalCo2 || 0) - totalOtherGas
  const co2b = EFOrEFPart.co2b || 0

  return {
    co2: value * co2,
    ch4: value * ch4,
    n2o: value * n2o,
    other: value * other,
    total: value * (totalOtherGas + co2),
    co2b: value * co2b,
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

export const getBegesEmissionTotal = (emissionSource: EmissionSource, emissionFactor: ExportEmissionFactor) =>
  getEmissionTotal(emissionSource, emissionFactor, getBegesEmissionValue, getLine)

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
    getLine,
  )
