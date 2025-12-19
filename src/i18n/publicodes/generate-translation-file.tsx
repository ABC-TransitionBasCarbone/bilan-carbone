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

function getOrCreateNestedObject(obj: TranslationRecord, path: string[]): TranslationRecord {
  let current = obj
  for (const segment of path) {
    if (!current[segment]) {
      current[segment] = {}
    }
    current = current[segment]
  }
  return current
}

function updateTranslationValue(
  frObj: TranslationRecord,
  enObj: TranslationRecord,
  esObj: TranslationRecord,
  key: string,
  newValue: string,
  ruleName: string,
): void {
  const existingValue = frObj[key]

  if (!existingValue) {
    frObj[key] = newValue
    enObj[key] = `${TO_TRANSLATE_PREFIX} ${newValue}`
    esObj[key] = `${TO_TRANSLATE_PREFIX} ${newValue}`
  } else if (existingValue !== newValue) {
    console.log(`Updated translation for ${ruleName}.${key}: "${existingValue}" -> "${newValue}"`)
    frObj[key] = newValue
    enObj[key] = `${UPDATED_PREFIX} ${newValue}`
    esObj[key] = `${UPDATED_PREFIX} ${newValue}`
  }
}

function generateNestedTranslationFile(): void {
  const translationFR = loadTranslation('fr')
  const translationEN = loadTranslation('en')
  const translationES = loadTranslation('es')

  const updatedFR: TranslationRecord = { ...(translationFR['publicodes-rules'] ?? {}) }
  const updatedEN: TranslationRecord = { ...(translationEN['publicodes-rules'] ?? {}) }
  const updatedES: TranslationRecord = { ...(translationES['publicodes-rules'] ?? {}) }

  const extractedTranslations = extractTranslationKeysFromRules(rules)

  for (const [ruleName, translationKeys] of Object.entries(extractedTranslations)) {
    const nameSpaces = ruleName.split(' . ')
    const parentPath = nameSpaces.slice(0, -1)
    const lastNameSpace = nameSpaces[nameSpaces.length - 1]

    const parentFR = getOrCreateNestedObject(updatedFR, parentPath)
    const parentEN = getOrCreateNestedObject(updatedEN, parentPath)
    const parentES = getOrCreateNestedObject(updatedES, parentPath)

    if (!parentFR[lastNameSpace]) parentFR[lastNameSpace] = {}
    if (!parentEN[lastNameSpace]) parentEN[lastNameSpace] = {}
    if (!parentES[lastNameSpace]) parentES[lastNameSpace] = {}

    for (const [key, value] of Object.entries(translationKeys)) {
      updateTranslationValue(
        parentFR[lastNameSpace],
        parentEN[lastNameSpace],
        parentES[lastNameSpace],
        key,
        value.trim(),
        ruleName,
      )
    }
  }

  removeEmptyObjects(updatedFR)
  removeEmptyObjects(updatedEN)
  removeEmptyObjects(updatedES)

  saveTranslation('fr', { ...translationFR, 'publicodes-rules': updatedFR })
  saveTranslation('en', { ...translationEN, 'publicodes-rules': updatedEN })
  saveTranslation('es', { ...translationES, 'publicodes-rules': updatedES })

  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
