// lib/zod-config.ts
import { LocaleType } from '@/i18n/config'
import { Translations } from '@/types/translation'
import * as z from 'zod'

export function configureZod(locale: LocaleType, t?: Translations) {
  if (locale === 'en') {
    z.config(z.locales.en())
  } else if (locale === 'fr') {
    z.config(z.locales.fr())
  }

  if (t) {
    z.config({
      customError: (issue) => {
        switch (issue.code) {
          case 'too_small':
            if (issue.minimum === 0) {
              return t('positiveNumber')
            } else if (issue.minimum === 1) {
              return t('required')
            } else if (issue.minimum === 14) {
              return t('siretInvalid')
            } else {
              return t('tooSmall')
            }
          case 'too_big':
            if (issue.maximum === 14) {
              return t('siretInvalid')
            } else if (issue.maximum === 64) {
              return t('nameMaxLength')
            } else {
              return t('tooBig')
            }
          case 'invalid_format':
            if (issue.input === '') {
              return t('required')
            }
            if (issue.format === 'email') {
              return t('invalidEmail')
            }
            break
          case 'invalid_type':
            if (issue.expected === 'number') {
              return t('invalidNumber')
            } else if (issue.expected === 'string') {
              return t('invalidString')
            }
            break
          case 'invalid_value':
            if (issue.values.length > 0) {
              return t('invalidEnum')
            }
            break
          case 'custom': {
            if (issue.params?.message) {
              return t(issue.params.message)
            }
            break
          }
          default:
            return undefined
        }
      },
    })
  }
}

/**
 * Create a custom message for zod refine() method
 */
export const setCustomMessage = (message: string) => {
  return { params: { message } }
}

/**
 * Create a custom issue for zod superRefine() method
 */

export const setCustomIssue = (path: string[], message: string): z.core.$ZodSuperRefineIssue => {
  return { code: 'custom', path, ...setCustomMessage(message) }
}
