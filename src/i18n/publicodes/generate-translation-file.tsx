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

function loadTranslation(locale: string): TranslationRecord {
  return readJSONFile(path.join(TRANSLATIONS_DIR, locale, 'cut.json')) ?? {}
}

function saveTranslation(locale: string, data: TranslationRecord): void {
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
  existingFR: TranslationRecord,
  existingEN: TranslationRecord,
  existingES: TranslationRecord,
): { updatedFR: TranslationRecord; updatedEN: TranslationRecord; updatedES: TranslationRecord } {
  const updatedFR: TranslationRecord = {}
  const updatedEN: TranslationRecord = {}
  const updatedES: TranslationRecord = {}

  for (const [ruleName, translationKeys] of Object.entries(extractedTranslations)) {
    const nameSpaces = ruleName.split(' . ')
    const parentPath = nameSpaces.slice(0, -1)
    const lastNameSpace = nameSpaces[nameSpaces.length - 1]

    const parentFR = getNestedObject(updatedFR, parentPath, true)!
    const parentEN = getNestedObject(updatedEN, parentPath, true)!
    const parentES = getNestedObject(updatedES, parentPath, true)!

    // Get existing translations for this rule
    const existingParentFR = getNestedObject(existingFR, parentPath)
    const existingParentEN = getNestedObject(existingEN, parentPath)
    const existingParentES = getNestedObject(existingES, parentPath)

    parentFR[lastNameSpace] = {}
    parentEN[lastNameSpace] = {}
    parentES[lastNameSpace] = {}

    for (const [key, value] of Object.entries(translationKeys)) {
      const trimmedValue = value.trim()
      const existingFRValue = existingParentFR?.[lastNameSpace]?.[key]
      const existingENValue = existingParentEN?.[lastNameSpace]?.[key]
      const existingESValue = existingParentES?.[lastNameSpace]?.[key]

      if (!existingFRValue) {
        // New key
        parentFR[lastNameSpace][key] = trimmedValue
        parentEN[lastNameSpace][key] = `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
        parentES[lastNameSpace][key] = `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
      } else if (existingFRValue !== trimmedValue) {
        // Updated key
        console.log(`Updated translation for ${ruleName}.${key}: "${existingFRValue}" -> "${trimmedValue}"`)
        parentFR[lastNameSpace][key] = trimmedValue
        parentEN[lastNameSpace][key] = `${UPDATED_PREFIX} ${trimmedValue}`
        parentES[lastNameSpace][key] = `${UPDATED_PREFIX} ${trimmedValue}`
      } else {
        // Keep existing translations
        parentFR[lastNameSpace][key] = existingFRValue
        parentEN[lastNameSpace][key] = existingENValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
        parentES[lastNameSpace][key] = existingESValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`
      }
    }
  }

  return { updatedFR, updatedEN, updatedES }
}

function generateNestedTranslationFile(): void {
  const translationFR = loadTranslation('fr')
  const translationEN = loadTranslation('en')
  const translationES = loadTranslation('es')

  const existingFR = translationFR['publicodes-rules'] ?? {}
  const existingEN = translationEN['publicodes-rules'] ?? {}
  const existingES = translationES['publicodes-rules'] ?? {}

  const extractedTranslations = extractTranslationKeysFromRules(rules)

  const { updatedFR, updatedEN, updatedES } = buildTranslationsFromRules(
    extractedTranslations,
    existingFR,
    existingEN,
    existingES,
  )

  removeEmptyObjects(updatedFR)
  removeEmptyObjects(updatedEN)
  removeEmptyObjects(updatedES)

  saveTranslation('fr', { ...translationFR, 'publicodes-rules': updatedFR })
  saveTranslation('en', { ...translationEN, 'publicodes-rules': updatedEN })
  saveTranslation('es', { ...translationES, 'publicodes-rules': updatedES })

  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
