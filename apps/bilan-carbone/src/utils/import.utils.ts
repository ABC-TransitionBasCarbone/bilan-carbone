import { LocaleType } from '@/i18n/config'
import { Unit } from '@abc-transitionbascarbone/db-common/enums'
import { BcTranslations, extractAllForms, getBcTranslations } from './translation.utils'

export function mapQualityLabelFromTranslations(label: string | undefined | null, locale: LocaleType): number | null {
  if (!label) {
    return null
  }
  const bc = getBcTranslations(locale)
  const map = Object.fromEntries(
    Object.entries(bc.quality)
      .filter(([k]) => /^[1-5]$/.test(k))
      .map(([k, v]) => [v.toLowerCase(), Number(k)]),
  )
  return map[String(label).trim().toLowerCase()] ?? null
}

export function mapLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  return buildMap(getBcTranslations(locale))[label.trim().toLowerCase()] ?? null
}

export function buildUnitLabelMap(bc: BcTranslations, unitList: Unit[]): Record<string, Unit> {
  const map: Record<string, Unit> = {}
  for (const unit of unitList) {
    const raw = (bc.units as Record<string, string>)[unit]
    if (!raw) {
      continue
    }
    for (const form of extractAllForms(raw)) {
      const key = form.toLowerCase()
      if (!(key in map)) {
        map[key] = unit
      }
    }
  }
  return map
}

export function mapUnitLabelFromTranslationsWithList(
  label: string | undefined | null,
  locale: LocaleType,
  unitList: Unit[],
): Unit | null {
  return mapLabelFromTranslations(label, locale, (bc) => buildUnitLabelMap(bc, unitList))
}

/**
 * Filters and casts the entries to the target type.
 */
export function buildLabelMap<T extends string>(
  entries: Record<string, unknown>,
  keyFilter: (k: string) => boolean,
  toValue: (k: string) => T,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(entries)
      .filter(([k, v]) => keyFilter(k) && typeof v === 'string')
      .map(([k, v]) => [(v as string).toLowerCase(), toValue(k)]),
  )
}
