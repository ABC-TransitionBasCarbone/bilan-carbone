import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { EmissionSourceCaracterisation, ExportRule } from '@prisma/client'
import {
  convertTiltEmissionSourceToBcEmissionSource,
  getStandardDeviation,
  sumStandardDeviations,
} from '../emissionSource'
import { Post, subPostsByPost } from '../posts'
import { filterWithDependencies, getSiteEmissionSources } from './utils'

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

export type BegesLine = {
  rule: string
  co2: number
  ch4: number
  n2o: number
  other: number
  total: number
  co2b: number
  uncertainty: number | null
}

interface EmissionFactor {
  ch4f: number | null
  co2b: number | null
  co2f: number | null
  n2o: number | null
  pfc: number | null
  hfc: number | null
  sf6: number | null
  otherGES: number | null
  totalCo2: number | null
}

type EmissionSource = Pick<FullStudy['emissionSources'][0], 'value' | 'subPost' | 'depreciationPeriod'>

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
    case EmissionSourceCaracterisation.LandUse:
      return rule.landUse
  }
}

export const getBegesEmissionValue = (emissionSource: EmissionSource): number => {
  if (!emissionSource.value) {
    return 0
  }

  let value = emissionSource.value
  if (subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost) && emissionSource.depreciationPeriod) {
    value = value / emissionSource.depreciationPeriod
  }
  return value
}

export const getBegesEmissionTotal = (emissionSource: EmissionSource, emissionFactor: EmissionFactor) => {
  const value = getBegesEmissionValue(emissionSource)
  return getBegesLine(value, emissionFactor).total
}

const getBegesLine = (value: number, emissionFactor: EmissionFactor): Omit<BegesLine, 'rule' | 'uncertainty'> => {
  const ch4 = emissionFactor.ch4f || 0
  const n2o = emissionFactor.n2o || 0
  const other =
    (emissionFactor.otherGES || 0) + (emissionFactor.pfc || 0) + (emissionFactor.hfc || 0) + (emissionFactor.sf6 || 0)
  const totalOtherGas = ch4 + n2o + other

  // co2f is not always available
  const co2 = (emissionFactor.totalCo2 || 0) - totalOtherGas
  const co2b = emissionFactor.co2b || 0

  return {
    co2: value * co2,
    ch4: value * ch4,
    n2o: value * n2o,
    other: value * other,
    total: value * (totalOtherGas + co2),
    co2b: value * co2b,
  }
}

const sumLines = (lines: Omit<BegesLine, 'rule'>[]) => {
  const total = lines.reduce((acc, line) => acc + line.total, 0)
  return {
    co2: lines.reduce((acc, line) => acc + line.co2, 0),
    ch4: lines.reduce((acc, line) => acc + line.ch4, 0),
    n2o: lines.reduce((acc, line) => acc + line.n2o, 0),
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

export const computeBegesResult = (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
) => {
  const results: Record<string, Omit<BegesLine, 'rule'>[]> = allRules.reduce(
    (acc, rule) => ({ ...acc, [rule]: [] }),
    {},
  )
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)

  siteEmissionSources
    .map((emissionSource) => {
      return convertTiltEmissionSourceToBcEmissionSource(emissionSource)
    })
    .filter((emissionSource) => filterWithDependencies(emissionSource.subPost, withDependencies))
    .forEach((emissionSource) => {
      if (
        emissionSource.emissionFactor === null ||
        !emissionSource.value ||
        (validatedOnly && !emissionSource.validated)
      ) {
        return
      }

      const id = emissionSource.emissionFactor.id
      const caracterisation = emissionSource.caracterisation
      const value = getBegesEmissionValue(emissionSource)

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
          results[post].push({
            ...getBegesLine(value, emissionFactor),
            uncertainty: uncertainty,
          })
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
            results[post].push({
              ...getBegesLine(value, part),
              uncertainty: uncertainty,
            })
          }
        })
      }
    })

  const lines = Object.entries(results).map(([rule, result]) => ({ rule, ...sumLines(result) }))
  lines.push({
    rule: 'total',
    ...sumLines(Object.values(lines)),
  })
  Array.from({ length: 6 }).map((_, index) => {
    const rule = (index + 1).toString()
    lines.push({
      rule: rule + '.total',
      ...sumLines(Object.values(lines).filter((line) => line.rule.startsWith(rule))),
    })
  })

  return lines.sort((a, b) => a.rule.localeCompare(b.rule))
}
