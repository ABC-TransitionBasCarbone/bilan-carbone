import { Rule } from 'publicodes'
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
  rulesMap: Record<string, Rule>,
): Record<string, Partial<Record<TranslationKey, string>>> {
  const translations: Record<string, Partial<Record<TranslationKey, string>>> = {}

  for (const [ruleName, rule] of Object.entries(rulesMap)) {
    if (!rule?.question) {
      continue
    }

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
      const existingFRValue = getStringValue(existingParents.fr ?? {}, [lastNameSpace, key])

      if (!existingFRValue) {
        // New key
        setStringValue(parents.fr, [lastNameSpace, key], trimmedValue)
        for (const locale of otherLocales) {
          setStringValue(parents[locale], [lastNameSpace, key], `${TO_TRANSLATE_PREFIX} ${trimmedValue}`)
        }
      } else if (existingFRValue !== trimmedValue) {
        // Updated key
        console.log(`Updated translation for ${ruleName}.${key}: "${existingFRValue}" -> "${trimmedValue}"`)
        setStringValue(parents.fr, [lastNameSpace, key], trimmedValue)
        for (const locale of otherLocales) {
          setStringValue(parents[locale], [lastNameSpace, key], `${UPDATED_PREFIX} ${trimmedValue}`)
        }
      } else {
        // Keep existing translations
        setStringValue(parents.fr, [lastNameSpace, key], existingFRValue)
        for (const locale of otherLocales) {
          const existingValue = getStringValue(existingParents[locale] ?? {}, [lastNameSpace, key])
          setStringValue(
            parents[locale],
            [lastNameSpace, key],
            existingValue ?? `${TO_TRANSLATE_PREFIX} ${trimmedValue}`,
          )
        }
      }
    }
  }

  return updated
}

async function generateNestedTranslationFile(): Promise<void> {
  const rules = await loadRulesForModel(model as Model)

  const translations = {} as Record<Locale, TranslationRecord>
  const existingRules = {} as Record<Locale, TranslationRecord>

  for (const locale of LOCALES) {
    translations[locale] = loadTranslation(locale, model as Model)
    existingRules[locale] = (translations[locale]['publicodes-rules'] ?? {}) as TranslationRecord
  }

  const extractedTranslations = extractTranslationKeysFromRules(rules)

  const updated = buildTranslationsFromRules(extractedTranslations, existingRules)

  for (const locale of LOCALES) {
    removeEmptyObjects(updated[locale])
    await saveTranslation(locale, model as Model, { ...translations[locale], 'publicodes-rules': updated[locale] })
  }

  console.log('Translation files updated successfully.')
}

generateNestedTranslationFile()
