import { Locale, LocaleType } from '@/i18n/config'
import enBc from '@/i18n/translations/en/bc.json'
import frBc from '@/i18n/translations/fr/bc.json'
import { environmentPostMapping, environmentSubPostsMapping } from '@/services/posts'
import { EmissionFactorBase, Environment, SubPost, Unit } from '@repo/db-common/enums'
import { ManualEmissionFactorUnitList } from './emissionFactors'

type BcTranslations = typeof frBc

function getBcTranslations(locale: LocaleType): BcTranslations {
  return locale === Locale.FR ? frBc : enBc
}

/**
 * Map a string label coming from the import file to a value of the right type
 * based on the translations file.
 */
function mapLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  return buildMap(getBcTranslations(locale))[label.trim().toLowerCase()] ?? null
}

function buildLabelMap<T extends string>(
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

export function mapBaseLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionFactorBase | null {
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.base,
      () => true,
      (k) => k as EmissionFactorBase,
    ),
  )
}

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

export function mapPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): string | null {
  const envPosts = environmentPostMapping[environment]
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post,
      (k) => k in envPosts,
      (k) => k,
    ),
  )
}

export function mapSubPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): SubPost | null {
  const envSubPosts = Object.keys(environmentSubPostsMapping[environment])
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post,
      (k) => envSubPosts.includes(k),
      (k) => k as SubPost,
    ),
  )
}

function extractUnitForms(value: string): string[] {
  const icuMatch = value.match(/\{[^}]+\}/g)
  if (icuMatch) {
    return icuMatch.map((s) => s.slice(1, -1).trim())
  }
  return [value.trim()]
}

function buildUnitLabelMap(bc: BcTranslations): Record<string, Unit> {
  const entries: [string, Unit][] = []
  for (const unit of ManualEmissionFactorUnitList) {
    const raw = (bc.units as Record<string, string>)[unit]
    if (!raw) {
      continue
    }
    for (const form of extractUnitForms(raw)) {
      entries.push([form.toLowerCase(), unit])
    }
  }
  return Object.fromEntries(entries)
}

export function mapUnitLabelFromTranslations(label: string | undefined | null, locale: LocaleType): Unit | null {
  return mapLabelFromTranslations(label, locale, buildUnitLabelMap)
}

type ParseError = { key: string; value?: string }

export type ParsePostsResult =
  | { success: true; subPosts: Record<string, SubPost[]> }
  | { success: false; errors: ParseError[] }

// Format: "Post1 : SubPost1 | SubPost2 || Post2 : SubPost3"
// || separates post groups, | separates subposts within a group, : binds post to its first subpost
export function parsePostsAndSubPostsCell(
  cell: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): ParsePostsResult {
  if (!cell) {
    return { success: false, errors: [{ key: 'missingPostsAndSubPosts' }] }
  }
  const result: Record<string, SubPost[]> = {}
  const errors: ParseError[] = []
  const groups = String(cell)
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const group of groups) {
    const [postPart, ...subPostParts] = group.split(':').map((s) => s.trim())
    const post = mapPostLabelFromTranslations(postPart, locale, environment)
    if (!post) {
      errors.push({ key: 'invalidPost', value: postPart })
      continue
    }
    const subPostTokens = subPostParts
      .join(':')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const token of subPostTokens) {
      const subPost = mapSubPostLabelFromTranslations(token, locale, environment)
      if (!subPost) {
        errors.push({ key: 'invalidSubPost', value: token })
      } else {
        result[post] = [...(result[post] ?? []), subPost]
      }
    }
    if (subPostTokens.length === 0) {
      errors.push({ key: 'missingSubPosts', value: postPart })
    }
  }
  if (errors.length > 0) {
    return { success: false, errors }
  }
  return { success: true, subPosts: result }
}
