import enBc from '@/i18n/translations/en/bc.json'
import frBc from '@/i18n/translations/fr/bc.json'
import { Locale, LocaleType } from '@abc-transitionbascarbone/i18n/config'
import enCommon from '@abc-transitionbascarbone/i18n/translations/en/common.json'
import frCommon from '@abc-transitionbascarbone/i18n/translations/fr/common.json'

export type CommonTranslations = typeof frCommon

export function getCommonTranslations(locale: LocaleType): CommonTranslations {
  return locale === Locale.FR ? frCommon : enCommon
}

/**
 * Extracts the ="one" singular form from an ICU plural string, e.g. "{count, plural, =0 {None} one {Litre} other {Litres}}" → "Litre"
 */
export function getSingularForm(value: string): string {
  const match = value.match(/\bone\s*\{([^}]+)\}/)
  return match ? match[1].trim() : value.trim()
}

/**
 * Extracts the forms from an ICU plural string
 * e.g. "{count, plural, =0 {Litre} one {Litre} other {Litres}}" → ["Litre", "Litres"]
 */
export function extractAllForms(value: string): string[] {
  const hasPlural = /\{[^{}]*,\s*plural/.test(value)
  if (hasPlural) {
    const forms = [...value.matchAll(/(?:=\d+|one|other)\s*\{([^}]+)\}/g)].map((m) => m[1].trim())
    return forms.length ? [...new Set(forms)] : [value.trim()]
  }
  return [value.trim()]
}

export type BcTranslations = typeof frBc

export function getBcTranslations(locale: LocaleType): BcTranslations {
  return locale === Locale.FR ? frBc : enBc
}
