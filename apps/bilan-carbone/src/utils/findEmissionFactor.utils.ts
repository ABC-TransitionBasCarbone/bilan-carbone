import {
  findEmissionFactorByIdForMatch,
  findEmissionFactorsByNameAndUnit,
  findEmissionFactorsByUnit,
} from '@/db/emissionFactors'

type EfMatchResult =
  | {
      matchType: 'exact' | 'nameOnly' | 'valueAndUnitOnly'
      id: string
      foundTitle?: string
      foundValue?: number
      foundUnit?: string
    }
  | { matchType: 'nameAmbiguous'; candidates: { foundTitle?: string; foundValue?: number; foundUnit?: string }[] }

export type EfRow = {
  id: string
  totalCo2: number
  unit: string | null
  customUnit: string | null
  metaData: { title: string | null; language: string }[]
}

function toEfMatch(ef: EfRow, matchType: 'exact' | 'nameOnly' | 'valueAndUnitOnly', locale: string) {
  return {
    matchType,
    id: ef.id,
    foundTitle: ef.metaData.find((m) => m.language === locale)?.title ?? undefined,
    foundValue: ef.totalCo2,
    foundUnit: ef.customUnit ?? ef.unit ?? undefined,
  }
}

export async function findEmissionFactorMatch(
  id: string | undefined,
  title: string | undefined,
  value: number | undefined,
  unit: string | undefined,
  locale: string,
  organizationId: string,
): Promise<EfMatchResult | null> {
  if (id) {
    const byId = await findEmissionFactorByIdForMatch(id, organizationId)
    if (byId) {
      return toEfMatch(byId, 'exact', locale)
    }
  }

  const orgFilter = { OR: [{ organizationId: null }, { organizationId }] }
  const unitFilter = unit ? { OR: [{ unit }, { customUnit: unit }] } : {}
  const epsilon = 1e-9

  const byNameAndUnit = await findEmissionFactorsByNameAndUnit(title ?? '', locale, orgFilter, unitFilter)

  if (value !== undefined) {
    const exact = byNameAndUnit.find((ef) => Math.abs(Number(ef.totalCo2) - value) < epsilon)
    if (exact) {
      return toEfMatch(exact, 'exact', locale)
    }
  }

  if (byNameAndUnit.length === 1) {
    return toEfMatch(byNameAndUnit[0], 'nameOnly', locale)
  }

  if (byNameAndUnit.length > 1) {
    return {
      matchType: 'nameAmbiguous',
      candidates: byNameAndUnit.map((ef) => toEfMatch(ef, 'nameOnly', locale)),
    }
  }

  if (value !== undefined && unit) {
    const byUnit = await findEmissionFactorsByUnit(orgFilter, unitFilter)
    const match = byUnit.find((ef) => Math.abs(Number(ef.totalCo2) - value) < epsilon)
    if (match) {
      return toEfMatch(match, 'valueAndUnitOnly', locale)
    }
  }

  return null
}
