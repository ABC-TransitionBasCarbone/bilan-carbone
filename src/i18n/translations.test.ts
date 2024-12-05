/* eslint-disable mocha/no-setup-in-describe */
// from the doc https://github.com/lo1tuma/eslint-plugin-mocha/blob/main/docs/rules/no-setup-in-describe.md
// if you're using dynamically generated tests, you should disable this rule.
import { expect } from '@jest/globals'
import en from './en.json'
import fr from './fr.json'

type Translation = { [k: string]: string | Translation }

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

describe('Translations', () => {
  checkKeys(en, fr, [], 'fr')
  checkKeys(fr, en, [], 'en')
})
