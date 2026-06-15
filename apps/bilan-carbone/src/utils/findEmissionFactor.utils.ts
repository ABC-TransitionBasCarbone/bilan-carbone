import { DEFAULT_FUZZY_OPTIONS } from '@/constants/fuse.constant'
import {
  findEmissionFactorByImportedIdForMatch,
  findEmissionFactorsByNameAndUnit,
  findEmissionFactorsByUnit,
} from '@/db/emissionFactors'
import { getEmissionFactorFullName } from '@/utils/emissionFactors'
import { normalizeStringForSearch } from '@/utils/string'
import { Unit } from '@abc-transitionbascarbone/db-common/enums'
import Fuse from 'fuse.js'

export enum EmissionFactorMatchType {
  Exact = 'exact',
  NameAndUnitOnly = 'nameAndUnitOnly',
  ValueAndUnitOnly = 'valueAndUnitOnly',
  NameAmbiguous = 'nameAmbiguous',
}

type EfMatchResult =
  | {
      matchType:
        | EmissionFactorMatchType.Exact
        | EmissionFactorMatchType.NameAndUnitOnly
        | EmissionFactorMatchType.ValueAndUnitOnly
      id: string
      importedId?: string | null
      importedFrom?: string | null
      foundTitle?: string
      foundValue?: number
      foundUnit?: string
    }
  | {
      matchType: EmissionFactorMatchType.NameAmbiguous
      candidates: { id: string; foundTitle?: string; foundValue?: number; foundUnit?: string }[]
    }

export type EfRow = {
  id: string
  importedId?: string | null
  importedFrom?: string | null
  totalCo2: number
  unit: string | null
  customUnit: string | null
  location?: string | null
  metaData: {
    title: string | null
    attribute: string | null
    frontiere: string | null
    language: string
  }[]
}

function getEfFullName(ef: EfRow, locale: string): string {
  return getEmissionFactorFullName(
    ef.metaData.find((m) => m.language === locale) ??
      ef.metaData[0] ?? { title: null, attribute: null, frontiere: null },
  )
}

/**
 * Match emission factors by exact full name.
 *
 * If there is only one exact match, we return the exact match.
 * If there is more than one exact match, we check if the value is close to the exact match.
 */
function matchByExactFullName(
  efs: EfRow[],
  normalizedSearch: string,
  locale: string,
  value: number | undefined,
  epsilon: number,
): EfMatchResult | null {
  const matches = efs.filter((ef) => normalizeStringForSearch(getEfFullName(ef, locale)) === normalizedSearch)
  if (matches.length === 1) {
    return toEfMatch(matches[0], EmissionFactorMatchType.Exact, locale)
  }

  if (matches.length > 1) {
    if (value !== undefined) {
      const exactByValue = matches.filter((ef) => Math.abs(Number(ef.totalCo2) - value) < epsilon)
      if (exactByValue.length === 1) {
        return toEfMatch(exactByValue[0], EmissionFactorMatchType.Exact, locale)
      }

      if (exactByValue.length > 1) {
        return {
          matchType: EmissionFactorMatchType.NameAmbiguous,
          candidates: exactByValue.map((ef) => toEfMatch(ef, EmissionFactorMatchType.NameAndUnitOnly, locale)),
        }
      }
    }

    return {
      matchType: EmissionFactorMatchType.NameAmbiguous,
      candidates: matches.map((ef) => toEfMatch(ef, EmissionFactorMatchType.NameAndUnitOnly, locale)),
    }
  }
  return null
}

function toEfMatch(
  ef: EfRow,
  matchType:
    | EmissionFactorMatchType.Exact
    | EmissionFactorMatchType.NameAndUnitOnly
    | EmissionFactorMatchType.ValueAndUnitOnly,
  locale: string,
) {
  return {
    matchType,
    id: ef.id,
    importedId: ef.importedId,
    importedFrom: ef.importedFrom,
    foundTitle: getEfFullName(ef, locale) || undefined,
    foundValue: ef.totalCo2,
    foundUnit: ef.customUnit ?? ef.unit ?? undefined,
  }
}

function resolveByLocalization(
  candidates: EfRow[],
  localization: string,
  locale: string,
  matchType:
    | EmissionFactorMatchType.Exact
    | EmissionFactorMatchType.NameAndUnitOnly
    | EmissionFactorMatchType.ValueAndUnitOnly,
): EfMatchResult | null {
  const normalized = localization.trim().toLowerCase()
  const match = candidates.find((ef) => ef.location?.trim().toLowerCase() === normalized)
  return match ? toEfMatch(match, matchType, locale) : null
}

export async function findEmissionFactorMatch(
  id: string | undefined,
  title: string | undefined,
  value: number | undefined,
  unit: Unit | undefined,
  locale: string,
  organizationId: string,
  versionIds: string[],
  localization?: string,
): Promise<EfMatchResult | null> {
  if (id) {
    const byId = await findEmissionFactorByImportedIdForMatch(id, organizationId, versionIds)
    if (byId) {
      return toEfMatch(byId, EmissionFactorMatchType.Exact, locale)
    }
  }

  const epsilon = 1e-2

  const byNameAndUnit = await findEmissionFactorsByNameAndUnit(
    title?.trim() ?? '',
    locale,
    organizationId,
    unit,
    versionIds,
  )

  if (value !== undefined) {
    const exact = byNameAndUnit.find((ef) => Math.abs(Number(ef.totalCo2) - value) < epsilon)
    if (exact) {
      return toEfMatch(exact, EmissionFactorMatchType.Exact, locale)
    }
  }

  if (byNameAndUnit.length === 1) {
    // If there is no value provided to compare, we consider it as an exact match
    const matchType = value === undefined ? EmissionFactorMatchType.Exact : EmissionFactorMatchType.NameAndUnitOnly
    return toEfMatch(byNameAndUnit[0], matchType, locale)
  }

  if (byNameAndUnit.length > 1 && title) {
    const result = matchByExactFullName(byNameAndUnit, normalizeStringForSearch(title), locale, value, epsilon)
    if (result) {
      return result
    }
  }

  if (byNameAndUnit.length > 1) {
    if (localization) {
      const byLoc = resolveByLocalization(byNameAndUnit, localization, locale, EmissionFactorMatchType.Exact)
      if (byLoc) {
        return byLoc
      }
    }
    return {
      matchType: EmissionFactorMatchType.NameAmbiguous,
      candidates: byNameAndUnit.map((ef) => toEfMatch(ef, EmissionFactorMatchType.NameAndUnitOnly, locale)),
    }
  }

  if (unit && (title || value !== undefined)) {
    const byUnit = await findEmissionFactorsByUnit(organizationId, unit, versionIds)

    if (title) {
      const normalizedSearch = normalizeStringForSearch(title)

      const exactResult = matchByExactFullName(byUnit, normalizedSearch, locale, value, epsilon)
      if (exactResult) {
        if (localization && exactResult.matchType === EmissionFactorMatchType.NameAmbiguous) {
          const byLoc = resolveByLocalization(
            byUnit.filter((ef) => exactResult.candidates.some((c) => c.id === ef.id)),
            localization,
            locale,
            EmissionFactorMatchType.Exact,
          )
          if (byLoc) {
            return byLoc
          }
        }
        return exactResult
      }

      const candidates: { ef: EfRow; normalizedFullName: string }[] = byUnit.map((ef) => ({
        ef,
        normalizedFullName: normalizeStringForSearch(getEfFullName(ef, locale)),
      }))

      const fuse = new Fuse(candidates, {
        keys: ['normalizedFullName'],
        ...DEFAULT_FUZZY_OPTIONS,
      })

      const results = fuse.search(normalizedSearch)

      if (results.length === 1) {
        return toEfMatch(results[0].item.ef, EmissionFactorMatchType.NameAndUnitOnly, locale)
      }

      if (results.length > 1) {
        if (value !== undefined) {
          const exactByValue = results.find((r) => Math.abs(Number(r.item.ef.totalCo2) - value) < epsilon)
          if (exactByValue) {
            return toEfMatch(exactByValue.item.ef, EmissionFactorMatchType.Exact, locale)
          }
        }

        if (localization) {
          const byLoc = resolveByLocalization(
            results.map((r) => r.item.ef),
            localization,
            locale,
            EmissionFactorMatchType.Exact,
          )
          if (byLoc) {
            return byLoc
          }
        }

        return {
          matchType: EmissionFactorMatchType.NameAmbiguous,
          candidates: results.map((r) => toEfMatch(r.item.ef, EmissionFactorMatchType.NameAndUnitOnly, locale)),
        }
      }
    }

    if (value !== undefined) {
      const match = byUnit.find((ef) => Math.abs(Number(ef.totalCo2) - value) < epsilon)
      if (match) {
        return toEfMatch(match, EmissionFactorMatchType.ValueAndUnitOnly, locale)
      }
    }
  }

  return null
}
