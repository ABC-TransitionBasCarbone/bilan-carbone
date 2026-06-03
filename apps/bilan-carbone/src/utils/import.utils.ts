import { DEFAULT_FUZZY_OPTIONS } from '@/constants/fuse.constant'
import { KG_CO2E_PREFIX } from '@/constants/import'
import { LocaleType } from '@/i18n/config'
import { Unit } from '@abc-transitionbascarbone/db-common/enums'
import Fuse from 'fuse.js'
import { BcTranslations, extractAllForms, getBcTranslations, getSingularForm } from './translation.utils'

export function matchLabelFromMap<T>(label: string | undefined | null, map: Record<string, T>): T | null {
  if (!label) {
    return null
  }
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

export function matchLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  return matchLabelFromMap(label, buildMap(getBcTranslations(locale)))
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

export function matchUnitLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  unitList: Unit[],
): Unit | null {
  return matchLabelFromTranslations(label, locale, (bc) => buildUnitLabelMap(bc, unitList))
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

export function formatPrefixedUnitLabel(label: string): string {
  return `${KG_CO2E_PREFIX}${label}`
}

export function formatPrefixedUnitDisplay(locale: LocaleType, unit: Unit | string, customLabel?: string): string {
  if (unit === Unit.CUSTOM) {
    return formatPrefixedUnitLabel(customLabel ?? '')
  }
  const raw = (getBcTranslations(locale).units as Record<string, string>)[unit as string]
  const label = raw ? getSingularForm(raw) : (unit as string)
  return formatPrefixedUnitLabel(label)
}

export function formatPrefixedUnitDisplayOptional(locale: LocaleType, unit: string | undefined): string {
  if (!unit) {
    return ''
  }
  return formatPrefixedUnitDisplay(locale, unit)
}
