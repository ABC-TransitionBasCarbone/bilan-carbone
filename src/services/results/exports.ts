import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { EmissionSourceCaracterisation, ExportRule } from '@prisma/client'
import { getStandardDeviation, sumStandardDeviations } from '../emissionSource'
import { convertTiltSubPostToBCSubPost } from '../posts'
import { filterWithDependencies, getSiteEmissionSources } from './utils'

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
  uncertainty: number | null
}

export interface EmissionFactor {
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
}

const getRulePost = (caracterisation: EmissionSourceCaracterisation | null, rule?: ExportRule) => {
  if (!caracterisation || !rule) {
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

export type EmissionSource = Pick<
  FullStudy['emissionSources'][0],
  'value' | 'subPost' | 'depreciationPeriod' | 'constructionYear'
>

type GetLineFunctionType = (value: number, emissionFactor: EmissionFactor) => Omit<PostInfos, 'rule' | 'uncertainty'>

export const getEmissionTotal = (
  emissionSource: EmissionSource,
  emissionFactor: EmissionFactor,
  getEmissionValue: (source: EmissionSource) => number,
  getLine: GetLineFunctionType,
) => getLine(getEmissionValue(emissionSource), emissionFactor).total

const sumLines = (lines: Omit<PostInfos, 'rule'>[]) => {
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
    uncertainty: total
      ? sumStandardDeviations(lines.map((line) => ({ value: line.total, standardDeviation: line.uncertainty })))
      : null,
  }
}

const getDefaultRule = (rules: ExportRule[], caracterisation: EmissionSourceCaracterisation | null) => {
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
): PostInfos[] => {
  const results: Record<string, Omit<PostInfos, 'rule' | 'PostInfos'>[]> = allRules.reduce(
    (acc, rule) => ({ ...acc, [rule]: [] }),
    {},
  )
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)

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

      // l'incertitude est globale, peu importe
      const uncertainty = getStandardDeviation(emissionSource)

      if (emissionFactor.emissionFactorParts.length === 0) {
        // Pas de decomposition => on ventile selon la regle par default
        const post = getDefaultRule(subPostRules, caracterisation)
        if (post) {
          const line = getLine(value, emissionFactor)
          results[post].push({ ...line, uncertainty })
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
            results[post].push({ ...getLine(value, part), uncertainty })
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
