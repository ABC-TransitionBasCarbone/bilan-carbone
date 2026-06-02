import { DEFAULT_FUZZY_OPTIONS } from '@/constants/fuse.contstant'
import { LocaleType } from '@/i18n/config'
import { Unit } from '@abc-transitionbascarbone/db-common/enums'
import Fuse from 'fuse.js'
import { BcTranslations, extractAllForms, getBcTranslations } from './translation.utils'

export function mapLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  const map = buildMap(getBcTranslations(locale))
  const trimmed = label.trim().toLowerCase()
  if (trimmed in map) {
    return map[trimmed]
  }
  const keys = Object.keys(map)
  const fuse = new Fuse(keys, DEFAULT_FUZZY_OPTIONS)
  const results = fuse.search(trimmed)
  if (results.length > 0 && results[0].item) {
    return map[results[0].item]
  }
  return null
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

export const formatEf = (name: string | undefined, value: number | undefined, unit: string | undefined) =>
  [name, value !== undefined && unit ? `${value} ${unit}` : (value ?? unit)].filter(Boolean).join(' - ')
