import rules, { RuleName } from '@abc-transitionbascarbone/publicodes-count'
import path from 'path'
import { Rule } from 'publicodes'
import { readJSONFile, writeJSONFile } from './utils'

type TranslationKey = 'titre' | 'description' | 'question' | 'unité'
type TranslationRecord = Record<string, any>

const KEYS_TO_TRANSLATE: TranslationKey[] = ['titre', 'description', 'question', 'unité']
const TRANSLATIONS_DIR = path.join(__dirname, '../translations')

const TO_TRANSLATE_PREFIX = '[TO_TRANSLATE]'
const UPDATED_PREFIX = '[UPDATED]'

const LOCALES = ['fr', 'en', 'es'] as const
type Locale = (typeof LOCALES)[number]

function loadTranslation(locale: Locale): TranslationRecord {
  return readJSONFile(path.join(TRANSLATIONS_DIR, locale, 'cut.json')) ?? {}
}

function saveTranslation(locale: Locale, data: TranslationRecord): void {
  writeJSONFile(path.join(TRANSLATIONS_DIR, locale, 'cut.json'), data)
}

function extractTranslationKeysFromRules(
  rulesMap: Record<RuleName, Rule>,
): Record<string, Partial<Record<TranslationKey, string>>> {
  const translations: Record<string, Partial<Record<TranslationKey, string>>> = {}

  for (const [ruleName, rule] of Object.entries(rulesMap)) {
    if (!rule?.question) continue

    const ruleTranslations: Partial<Record<TranslationKey, string>> = {}
    for (const key of KEYS_TO_TRANSLATE) {
      if (rule[key]) {
        ruleTranslations[key] = rule[key] as string
      }
    }

    if (Object.keys(ruleTranslations).length > 0) {
      translations[ruleName] = ruleTranslations
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
    current = current[segment]
  }
  return current
}

function buildTranslationsFromRules(
  extractedTranslations: Record<string, Partial<Record<TranslationKey, string>>>,
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
      const trimmedValue = value.trim()
      const existingFRValue = existingParents.fr?.[lastNameSpace]?.[key]

      if (!existingFRValue) {
        // New key
        parents.fr[lastNameSpace][key] = trimmedValue
        for (const locale of otherLocales) {
          parents[locale][lastNameSpace][key] = `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
        }
      } else if (existingFRValue !== trimmedValue) {
        // Updated key
        console.log(`Updated translation for ${ruleName}.${key}: "${existingFRValue}" -> "${trimmedValue}"`)
        parents.fr[lastNameSpace][key] = trimmedValue
        for (const locale of otherLocales) {
          parents[locale][lastNameSpace][key] = `${UPDATED_PREFIX} ${trimmedValue}`
        }
      } else {
        // Keep existing translations
        parents.fr[lastNameSpace][key] = existingFRValue
        for (const locale of otherLocales) {
          const existingValue = existingParents[locale]?.[lastNameSpace]?.[key]
          parents[locale][lastNameSpace][key] = existingValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
        }
      }
    }
  }

  return updated
}

function generateNestedTranslationFile(): void {
  const translations: Record<Locale, TranslationRecord> = {} as Record<Locale, TranslationRecord>
  const existingRules: Record<Locale, TranslationRecord> = {} as Record<Locale, TranslationRecord>

  for (const locale of LOCALES) {
    translations[locale] = loadTranslation(locale)
    existingRules[locale] = translations[locale]['publicodes-rules'] ?? {}
  }

  const extractedTranslations = extractTranslationKeysFromRules(rules)

  const updated = buildTranslationsFromRules(extractedTranslations, existingRules)

  for (const locale of LOCALES) {
    removeEmptyObjects(updated[locale])
    saveTranslation(locale, { ...translations[locale], 'publicodes-rules': updated[locale] })
  }

  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
