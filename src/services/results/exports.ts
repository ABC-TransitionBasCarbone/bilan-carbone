import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { toCamelCase } from '@/utils/string'
import { getBaseFilteredEmissionSources } from '@/utils/study'
import { EmissionFactorBase, EmissionSourceCaracterisation, ExportRule, Import } from '@prisma/client'
import { convertTiltSubPostToBCSubPost } from '../posts'
import {
  getSquaredStandardDeviationForEmissionSource,
  getSquaredStandardDeviationForEmissionSourceArray,
} from '../uncertainty'
import { filterWithDependencies, getAllSiteEmissionSources } from './utils'

export type PostInfos = {
  rule: string
  co2: number
  ch4: number
  n2o: number
  hfc?: number
  pfc?: number
  sf6?: number
  other: number
  total: number
  co2b: number
  squaredStandardDeviation: number
}

export interface ExportEmissionFactor {
  ch4b: number | null
  ch4f: number | null
  co2b: number | null
  co2f: number | null
  n2o: number | null
  pfc?: number | null
  hfc?: number | null
  sf6?: number | null
  otherGES: number | null
  totalCo2: number | null
  importedFrom?: Import
  importedId?: string | null
}

const getRulePost = (caracterisation: EmissionSourceCaracterisation | null, rule?: ExportRule) => {
  if (!caracterisation || !rule) {
    return null
  }

  return rule[toCamelCase(caracterisation) as keyof typeof rule] as string | undefined
}

export type EmissionSource = Pick<
  FullStudy['emissionSources'][0],
  'value' | 'subPost' | 'depreciationPeriod' | 'constructionYear'
>

type GetLineFunctionType = (
  value: number,
  emissionFactor: ExportEmissionFactor,
) => Omit<PostInfos, 'rule' | 'squaredStandardDeviation'>

export const getEmissionTotal = (
  emissionSource: EmissionSource,
  emissionFactor: ExportEmissionFactor,
  getEmissionValue: (source: EmissionSource) => number,
  getLine: GetLineFunctionType,
) => getLine(getEmissionValue(emissionSource), emissionFactor).total

export const sumLines = (lines: Omit<PostInfos, 'rule'>[]) => {
  const total = lines.reduce((acc, line) => acc + line.total, 0)
  return {
    co2: lines.reduce((acc, line) => acc + line.co2, 0),
    ch4: lines.reduce((acc, line) => acc + line.ch4, 0),
    n2o: lines.reduce((acc, line) => acc + line.n2o, 0),
    hfc: lines.reduce((acc, line) => acc + (line.hfc || 0), 0),
    pfc: lines.reduce((acc, line) => acc + (line.pfc || 0), 0),
    sf6: lines.reduce((acc, line) => acc + (line.sf6 || 0), 0),
    other: lines.reduce((acc, line) => acc + line.other, 0),
    total,
    co2b: lines.reduce((acc, line) => acc + line.co2b, 0),
    squaredStandardDeviation: getSquaredStandardDeviationForEmissionSourceArray(
      lines.map((line) => ({ emissionValue: line.total, squaredStandardDeviation: line.squaredStandardDeviation })),
    ),
  }
}

export const getDefaultRule = (rules: ExportRule[], caracterisation: EmissionSourceCaracterisation | null) => {
  const rule = rules.find((rule) => rule.type === null)
  if (!rule) {
    return null
  }

  return getRulePost(caracterisation, rule)
}

const getRulesCount = (allRules: string[]) => new Set(allRules.map((rule) => rule.split('.')[0])).size

export const computeResult = (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean,
  allRules: string[],
  getEmissionValue: (emissionSource: EmissionSource) => number,
  getLine: GetLineFunctionType,
  base?: EmissionFactorBase,
): PostInfos[] => {
  const results: Record<string, Omit<PostInfos, 'rule' | 'PostInfos'>[]> = allRules.reduce(
    (acc, rule) => ({ ...acc, [rule]: [] }),
    {},
  )
  const siteEmissionSources = getBaseFilteredEmissionSources(
    getAllSiteEmissionSources(study.emissionSources, studySite),
    base,
  )

  siteEmissionSources
    .map((emissionSource) => ({ ...emissionSource, subPost: convertTiltSubPostToBCSubPost(emissionSource.subPost) }))
    .filter((emissionSource) => filterWithDependencies(emissionSource.subPost, withDependencies))
    .forEach((emissionSource) => {
      if (!emissionSource.emissionFactor || !emissionSource.value || (validatedOnly && !emissionSource.validated)) {
        return
      }

      const id = emissionSource.emissionFactor.id
      const caracterisation = emissionSource.caracterisation

      const value = getEmissionValue(emissionSource)

      const emissionFactor = emissionFactorsWithParts.find(
        (emissionFactorsWithParts) => emissionFactorsWithParts.id === id,
      )

      if (!emissionFactor) {
        return
      }

      const subPostRules = rules.filter((rule) => rule.subPost === emissionSource.subPost)
      if (subPostRules.length === 0) {
        return
      }

      // The uncertainty is on the emissionFactor, so we use the same for emission factor and emission factor part
      const squaredStandardDeviation = getSquaredStandardDeviationForEmissionSource(emissionSource)

      if (emissionFactor.emissionFactorParts.length === 0) {
        // Pas de decomposition => on ventile selon la regle par default
        const post = getDefaultRule(subPostRules, caracterisation)
        if (post) {
          results[post].push({ ...getLine(value, emissionFactor), squaredStandardDeviation })
        }
      } else {
        emissionFactor.emissionFactorParts.forEach((part) => {
          const rule = subPostRules.find((rule) => rule.type === part.type)
          let post = getRulePost(caracterisation, rule)

          if (!post) {
            // On a pas de regle specifique pour cette composante => on ventile selon la regle par default
            post = getDefaultRule(subPostRules, caracterisation)
          }

          if (post) {
            // Et on ajoute la valeur selon la composante quoi qu'il arrive
            results[post].push({ ...getLine(value, part), squaredStandardDeviation })
          }
        })
      }
    })

  const lines: PostInfos[] = Object.entries(results).map(([rule, result]) => ({
    rule,
    ...sumLines(result),
  }))
  lines.push({ rule: 'total', ...sumLines(Object.values(lines)) })
  Array.from({ length: getRulesCount(allRules) }).map((_, index) => {
    const rule = (index + 1).toString()
    lines.push({
      rule: rule + '.total',
      ...sumLines(Object.values(lines).filter((line) => line.rule.startsWith(rule))),
    })
  })

  return lines.sort((a, b) => a.rule.localeCompare(b.rule))
}
