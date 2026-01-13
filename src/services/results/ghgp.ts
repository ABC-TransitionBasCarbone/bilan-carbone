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
  '2.1',
  '2.2',
  '3.1',
  '3.2',
  '3.3',
  '3.4',
  '3.5',
  '3.6',
  '3.7',
  '3.8',
  '4.09',
  '4.10',
  '4.11',
  '4.12',
  '4.13',
  '4.14',
  '4.15',
]

export const rulesSpans: Record<string, number> = {
  '1': 5,
  '2': 3,
  '3': 9,
  '4': 8,
  total: 1,
}

const getLine = (value: number, emissionFactor: ExportEmissionFactor): Omit<PostInfos, 'rule' | 'uncertainty'> => {
  const hfc = emissionFactor.hfc || 0
  const pfc = emissionFactor.pfc || 0
  const sf6 = emissionFactor.sf6 || 0
  const ch4 = (emissionFactor.ch4f || 0) + (emissionFactor.ch4b || 0)
  const n2o = emissionFactor.n2o || 0
  const other = emissionFactor.otherGES || 0
  const co2b = emissionFactor.co2b || 0

  // otherGES are not taken into account in ghgp table
  const total = (emissionFactor.totalCo2 || 0) - other
  const co2 = total - (hfc + pfc + sf6 + ch4 + n2o)

  return {
    co2: value * co2,
    ch4: value * ch4,
    n2o: value * n2o,
    hfc: value * hfc,
    pfc: value * pfc,
    sf6: value * sf6,
    other: value * other,
    co2b: value * co2b,
    total: value * total,
  }
}

export const getGHGPEmissionValue = (studyDate: Date) => (emissionSource: EmissionSource) => {
  if (!emissionSource.value) {
    return 0
  }

  let value = emissionSource.value
  if (
    hasDeprecationPeriod(emissionSource.subPost) &&
    emissionSource.constructionYear &&
    emissionSource.constructionYear.getFullYear() !== studyDate.getFullYear()
  ) {
    value = 0
  }
  return value
}

export const getGHGPEmissionTotal = (
  emissionSource: EmissionSource,
  emissionFactor: ExportEmissionFactor,
  studyStartDate: Date,
) => getEmissionTotal(emissionSource, emissionFactor, getGHGPEmissionValue(studyStartDate), getLine)

export const computeGHGPResult = (
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
    getGHGPEmissionValue(study.startDate),
    getLine,
  )
