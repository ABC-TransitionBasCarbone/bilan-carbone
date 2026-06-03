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
      foundTitle?: string
      foundValue?: number
      foundUnit?: string
    }
  | {
      matchType: EmissionFactorMatchType.NameAmbiguous
      candidates: { foundTitle?: string; foundValue?: number; foundUnit?: string }[]
    }

export type EfRow = {
  id: string
  totalCo2: number
  unit: string | null
  customUnit: string | null
  metaData: { title: string | null; attribute: string | null; frontiere: string | null; language: string }[]
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
    foundTitle:
      getEmissionFactorFullName(
        ef.metaData.find((m) => m.language === locale) ??
          ef.metaData[0] ?? { title: null, attribute: null, frontiere: null },
      ) || undefined,
    foundValue: ef.totalCo2,
    foundUnit: ef.customUnit ?? ef.unit ?? undefined,
  }
}

export async function findEmissionFactorMatch(
  id: string | undefined,
  title: string | undefined,
  value: number | undefined,
  unit: Unit | undefined,
  locale: string,
  organizationId: string,
  versionIds: string[],
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
    return toEfMatch(byNameAndUnit[0], EmissionFactorMatchType.NameAndUnitOnly, locale)
  }

  if (byNameAndUnit.length > 1) {
    return {
      matchType: EmissionFactorMatchType.NameAmbiguous,
      candidates: byNameAndUnit.map((ef) => toEfMatch(ef, EmissionFactorMatchType.NameAndUnitOnly, locale)),
    }
  }

  if (unit && (title || value !== undefined)) {
    const byUnit = await findEmissionFactorsByUnit(organizationId, unit, versionIds)

    if (title) {
      const normalizedSearch = normalizeStringForSearch(title)
      const candidates = byUnit.map((ef) => ({
        ef,
        normalizedFullName: normalizeStringForSearch(
          getEmissionFactorFullName(
            ef.metaData.find((m) => m.language === locale) ??
              ef.metaData[0] ?? { title: null, attribute: null, frontiere: null },
          ),
        ),
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
