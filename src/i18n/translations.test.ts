/* eslint-disable mocha/no-setup-in-describe */
// from the doc https://github.com/lo1tuma/eslint-plugin-mocha/blob/main/docs/rules/no-setup-in-describe.md
// if you're using dynamically generated tests, you should disable this rule.
import { expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { Locale } from './config'

type Translation = { [k: string]: string | Translation }

interface TranslationObj {
  name: string
  fr: Translation
  en?: Translation
  es?: Translation
}

const translationsToCheck: Record<string, Locale[]> = {
  common: [Locale.EN, Locale.FR, Locale.ES],
  bc: [Locale.EN, Locale.FR],
  cut: [Locale.EN, Locale.FR, Locale.ES],
  tilt: [Locale.EN, Locale.FR, Locale.ES],
  clickson: [Locale.EN, Locale.FR, Locale.ES],
}

const loadTranslations = (): TranslationObj[] => {
  const translationsDir = path.join(__dirname, 'translations')
  const baseNames = ['common', 'bc', 'cut', 'tilt', 'clickson']

  return baseNames.map((baseName) => {
    const translation: Partial<TranslationObj> = { name: baseName }

    for (const lang of Object.values(Locale)) {
      const langPath = path.join(translationsDir, lang, `${baseName}.json`)
      translation[lang] = fs.existsSync(langPath) ? JSON.parse(fs.readFileSync(langPath, 'utf8')) : null
    }

    return translation as TranslationObj
  })
}

const checkKeys = (translationA: Translation, translationB: Translation, path: string[], file: string) => {
  Object.keys(translationA).forEach((key) => {
    const currentPath = [...path, key].join('.')

    it(`should have translation ${currentPath} in ${file}`, () => {
      expect(translationB[key]).toBeDefined()
    })

    if (typeof translationA[key] === 'object' && translationA[key] !== null) {
      checkKeys(translationA[key], translationB[key] as Translation, [...path, key], file)
    }
  })
}

const doubleCheck = (
  translationA: Translation,
  translationB: Translation,
  path: string[],
  name: string,
  lang: Locale,
) => {
  if (translationA && translationB) {
    checkKeys(translationA, translationB, path, `lang/${name}`)
    if (translationsToCheck[name]?.includes(lang)) {
      checkKeys(translationB, translationA, path, `${lang}/${name}`)
    }
  }
}

describe('Translations', () => {
  const translations = loadTranslations()

  describe('Translations', () => {
    translations.forEach(({ name, en, fr, es }) => {
      if (en) {
        doubleCheck(en, fr, [], name, Locale.EN)
      }
      if (es) {
        doubleCheck(es, fr, [], name, Locale.ES)
      }
    })
  })
})
