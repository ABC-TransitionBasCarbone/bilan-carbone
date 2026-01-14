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

const LOCALES = ['fr', ...destLang] as Locale[]

function extractTranslationKeysFromRules(
  engine: Engine,
  rulesMap: Record<string, Rule>,
): Record<string, Partial<TranslationRecord>> {
  const translations: Record<string, Partial<TranslationRecord>> = {}

  for (const [ruleName, rule] of Object.entries(rulesMap)) {
    if (!rule?.question) {
      continue
    }

    const ruleTranslations: Partial<TranslationRecord> = {}
    for (const key of KEYS_TO_TRANSLATE) {
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
  ruleName: string,
): void {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    const existingFRValue = getStringValue(existingParents.fr ?? {}, path)

    if (!existingFRValue) {
      // New key
      setStringValue(parents.fr, path, trimmedValue)
      for (const locale of otherLocales) {
        setStringValue(parents[locale], path, `${TO_TRANSLATE_PREFIX} ${trimmedValue}`)
      }
    } else if (existingFRValue !== trimmedValue) {
      // Updated key
      console.log(`Updated translation for ${ruleName}.${path.join('.')}: "${existingFRValue}" -> "${trimmedValue}"`)
      setStringValue(parents.fr, path, trimmedValue)
      for (const locale of otherLocales) {
        setStringValue(parents[locale], path, `${UPDATED_PREFIX} ${trimmedValue}`)
      }
    } else {
      // Keep existing translations
      setStringValue(parents.fr, path, existingFRValue)
      for (const locale of otherLocales) {
        const existingValue = getStringValue(existingParents[locale] ?? {}, path)
        setStringValue(parents[locale], path, existingValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`)
      }
    }
  } else {
    // Record<string, string> - iterate over each entry
    for (const [subKey, subValue] of Object.entries(value)) {
      processTranslationValue(subValue, [...path, subKey], parents, existingParents, otherLocales, ruleName)
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
      processTranslationValue(value, [lastNameSpace, key], parents, existingParents, otherLocales, ruleName)
    }
  }

  return updated
}

async function generateNestedTranslationFile(): Promise<void> {
  const rules = await loadRulesForModel(model as Model)
  const engine = new Engine(rules)

  const translations = {} as Record<Locale, TranslationRecord>
  const existingRules = {} as Record<Locale, TranslationRecord>

  for (const locale of LOCALES) {
    translations[locale] = loadTranslation(locale, model as Model)
    existingRules[locale] = (translations[locale]['publicodes-rules'] ?? {}) as TranslationRecord
  }

  const extractedTranslations = extractTranslationKeysFromRules(engine, rules)

  const updated = buildTranslationsFromRules(extractedTranslations, existingRules)

  for (const locale of LOCALES) {
    removeEmptyObjects(updated[locale])
    await saveTranslation(locale, model as Model, { ...translations[locale], 'publicodes-rules': updated[locale] })
  }

  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
