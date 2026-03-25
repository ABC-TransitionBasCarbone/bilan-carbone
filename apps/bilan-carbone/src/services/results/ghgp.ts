import { wasteImpact } from '@/constants/emissions'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { hasDeprecationPeriod } from '@/utils/study'
import type { ExportRule } from '@repo/db-common'
import { EmissionFactorBase, Environment, Import } from '@repo/db-common/enums'
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

const getEmissionFactorValue = (
  emissionFactor: Pick<ExportEmissionFactor, 'importedFrom' | 'importedId' | 'totalCo2' | 'otherGES'>,
) => {
  if (
    emissionFactor.importedFrom === Import.BaseEmpreinte &&
    emissionFactor.importedId &&
    wasteEmissionFactors[emissionFactor.importedId]
  ) {
    return wasteImpact
  }

  // otherGES are not taken into account in ghgp table
  return (emissionFactor.totalCo2 || 0) - (emissionFactor.otherGES || 0)
}

export const getLine = (
  value: number,
  EFOrEFPart: ExportEmissionFactor,
): Omit<PostInfos, 'rule' | 'squaredStandardDeviation'> => {
  const hfc = EFOrEFPart.hfc || 0
  const pfc = EFOrEFPart.pfc || 0
  const sf6 = EFOrEFPart.sf6 || 0
  const ch4 = (EFOrEFPart.ch4f || 0) + (EFOrEFPart.ch4b || 0)
  const n2o = EFOrEFPart.n2o || 0
  const other = EFOrEFPart.otherGES || 0
  const co2b = EFOrEFPart.co2b || 0

  const isFEPart = !EFOrEFPart.importedFrom || !EFOrEFPart.importedId
  const total = isFEPart
    ? (EFOrEFPart.totalCo2 || 0) - other // otherGES are not taken into account in ghgp table
    : getEmissionFactorValue(EFOrEFPart)

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
  base?: EmissionFactorBase,
  environment: Environment = Environment.BC,
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
    base,
    true,
    environment,
  )
