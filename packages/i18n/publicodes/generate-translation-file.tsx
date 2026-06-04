import { getI18nUnitKey } from '@abc-transitionbascarbone/publicodes/utils'
import Engine, { Rule } from 'publicodes'
import {
  getArgs,
  KEYS_TO_TRANSLATE,
  loadRulesForModel,
  loadTranslation,
  Locale,
  Model,
  saveTranslation,
  TO_TRANSLATE_PREFIX,
  TranslationKey,
  TranslationRecord,
  UPDATED_PREFIX,
} from './utils'

const { model, destLang } = getArgs()

// Définition statique des locales prises en charge pour chaque modèle
const LOCALES_CLICKSON = [
  Locale.FR,
  Locale.EN,
  Locale.ES,
  Locale.RO,
  Locale.IT,
  Locale.HU,
  Locale.HR,
  Locale.EL,
] as const
const LOCALES_TILT = [Locale.FR, Locale.EN]
const LOCALES_CUT = [Locale.FR, Locale.EN, Locale.ES] as const
const LOCALES_MIP = [Locale.FR, Locale.EN] as const
const getLocales = () => {
  switch (model) {
    case 'clickson':
      return LOCALES_CLICKSON
    case 'tilt':
      return LOCALES_TILT
    case 'cut':
      return LOCALES_CUT
    case 'mip':
      return LOCALES_MIP
    default:
      throw new Error(`Unsupported model: ${model}`)
  }
}
const LOCALES = getLocales()

function extractTranslationKeysFromRules(
  engine: Engine,
  rulesMap: Record<string, Rule & { form?: Record<string, string> }>,
  unitsSet: Set<string>,
): Record<string, Partial<TranslationRecord>> {
  const translations: Record<string, Partial<TranslationRecord>> = {}

  for (const [ruleName, rule] of Object.entries(rulesMap)) {
    if (!rule?.question && rule?.['form']?.['à traduire'] !== 'oui') {
      continue
    }

    const ruleTranslations: Partial<TranslationRecord> = {}
    for (const key of KEYS_TO_TRANSLATE) {
      if (key === 'unité') {
        if (rule[key]) {
          unitsSet.add(rule[key] as string)
        }
        continue
      }
      if (rule[key]) {
        ruleTranslations[key] = rule[key] as string
      }
    }

    if (Object.keys(ruleTranslations).length > 0) {
      translations[ruleName] = ruleTranslations
    }

    const possibilities = engine.getPossibilitiesFor(ruleName)
    if (possibilities !== null && possibilities.length > 0) {
      const options = {} as Record<string, string>
      for (const possibility of possibilities) {
        options[possibility.nodeValue] = possibility.title ?? String(possibility.nodeValue)
      }
      ruleTranslations.options = options
    }
  }
  return translations
}

function removeEmptyObjects(obj: TranslationRecord): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      removeEmptyObjects(value)
      if (Object.keys(value).length === 0) {
        delete obj[key]
      }
    }
  }
}

function getNestedObject(
  obj: TranslationRecord,
  path: string[],
  createIfMissing = false,
): TranslationRecord | undefined {
  let current = obj
  for (const segment of path) {
    if (!current[segment]) {
      if (createIfMissing) {
        current[segment] = {}
      } else {
        return undefined
      }
    }
    current = current[segment] as TranslationRecord
  }
  return current
}

function getStringValue(obj: TranslationRecord, path: string[]): string | undefined {
  if (path.length === 0) {
    return
  }
  const parent = getNestedObject(obj, path.slice(0, -1))
  const value = parent?.[path[path.length - 1]]
  return typeof value === 'string' ? value : undefined
}

function setStringValue(obj: TranslationRecord, path: string[], value: string): void {
  if (path.length === 0) {
    return
  }
  const parent = getNestedObject(obj, path.slice(0, -1), true)!
  parent[path[path.length - 1]] = value
}

type TranslationValue = string | Record<string, string>

function processTranslationValue(
  value: TranslationValue,
  path: string[],
  parents: Record<Locale, TranslationRecord>,
  existingParents: Record<Locale, TranslationRecord | undefined>,
  otherLocales: Locale[],
): void {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    const existingFRValue = getStringValue(existingParents.fr ?? {}, path)
    if (!existingFRValue) {
      setStringValue(parents.fr, path, trimmedValue)
      for (const locale of otherLocales) {
        setStringValue(parents[locale], path, `${TO_TRANSLATE_PREFIX} ${trimmedValue}`)
      }
    } else if (existingFRValue !== trimmedValue) {
      setStringValue(parents.fr, path, trimmedValue)
      for (const locale of otherLocales) {
        setStringValue(parents[locale], path, `${UPDATED_PREFIX} ${trimmedValue}`)
      }
    } else {
      setStringValue(parents.fr, path, existingFRValue)
      for (const locale of otherLocales) {
        const existingValue = getStringValue(existingParents[locale] ?? {}, path)
        setStringValue(parents[locale], path, existingValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`)
      }
    }
  } else {
    for (const [subKey, subValue] of Object.entries(value)) {
      processTranslationValue(subValue, [...path, subKey], parents, existingParents, otherLocales)
    }
  }
}

function buildTranslationsFromRules(
  extractedTranslations: Record<string, Partial<Record<TranslationKey, TranslationValue>>>,
  existingTranslations: Record<Locale, TranslationRecord>,
): Record<Locale, TranslationRecord> {
  const updated: Record<Locale, TranslationRecord> = Object.fromEntries(
    LOCALES.map((locale) => [locale, {}]),
  ) as Record<Locale, TranslationRecord>
  const otherLocales = LOCALES.filter((l) => l !== 'fr')
  for (const [ruleName, translationKeys] of Object.entries(extractedTranslations)) {
    const nameSpaces = ruleName.split(' . ')
    const parentPath = nameSpaces.slice(0, -1)
    const lastNameSpace = nameSpaces[nameSpaces.length - 1]
    const parents: Record<Locale, TranslationRecord> = {} as Record<Locale, TranslationRecord>
    const existingParents: Record<Locale, TranslationRecord | undefined> = {} as Record<
      Locale,
      TranslationRecord | undefined
    >
    for (const locale of LOCALES) {
      parents[locale] = getNestedObject(updated[locale], parentPath, true)!
      existingParents[locale] = getNestedObject(existingTranslations[locale], parentPath)
      parents[locale][lastNameSpace] = {}
    }
    for (const [key, value] of Object.entries(translationKeys)) {
      processTranslationValue(value, [lastNameSpace, key], parents, existingParents, otherLocales)
    }
  }
  return updated
}

function buildUnitsFromTranslations(
  unitsSet: Set<string>,
  existingUnits: Record<Locale, TranslationRecord>,
): Record<Locale, Record<string, string>> {
  const unitsByLocale: Record<Locale, Record<string, string>> = Object.fromEntries(
    LOCALES.map((locale) => [locale, {}]),
  ) as Record<Locale, Record<string, string>>

  for (const unit of unitsSet) {
    unitsByLocale.fr[getI18nUnitKey(unit)] = unit
  }
  for (const locale of LOCALES) {
    if (locale === 'fr') {
      continue
    }
    for (const unit of unitsSet) {
      const prev = existingUnits[locale]?.[unit]
      const i18nUnitKey = getI18nUnitKey(unit)
      if (!prev || typeof prev !== 'string') {
        unitsByLocale[locale][i18nUnitKey] = `${TO_TRANSLATE_PREFIX} ${unit}`
      } else if (prev.replace(/^\[.*?\]\s*/, '') !== unit) {
        unitsByLocale[locale][i18nUnitKey] = `${UPDATED_PREFIX} ${unit}`
      } else {
        unitsByLocale[locale][i18nUnitKey] = prev
      }
    }
  }
  return unitsByLocale
}

async function generateNestedTranslationFile(): Promise<void> {
  const rules = await loadRulesForModel(model as Model)
  const engine = new Engine(rules)
  const translations = {} as Record<Locale, TranslationRecord>
  const existingRules = {} as Record<Locale, TranslationRecord>
  const existingUnits = {} as Record<Locale, TranslationRecord>

  for (const locale of LOCALES) {
    translations[locale] = loadTranslation(locale, model as Model)
    existingRules[locale] = (translations[locale]['publicodes-rules'] ?? {}) as TranslationRecord
    existingUnits[locale] = (translations[locale]['publicodes-units'] ?? {}) as TranslationRecord
  }

  const unitsSet = new Set<string>()
  const extractedTranslations = extractTranslationKeysFromRules(engine, rules, unitsSet)
  const unitsByLocale = buildUnitsFromTranslations(unitsSet, existingUnits)
  const updated = buildTranslationsFromRules(extractedTranslations, existingRules)

  for (const locale of LOCALES) {
    removeEmptyObjects(updated[locale])
    await saveTranslation(locale, model as Model, {
      ...translations[locale],
      'publicodes-units': unitsByLocale[locale],
      'publicodes-rules': updated[locale],
    })
  }
  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
