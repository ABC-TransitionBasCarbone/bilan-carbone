export enum Locale {
  EN = 'en',
  FR = 'fr',
  ES = 'es',
}

export type LocaleType = typeof Locale.EN | typeof Locale.FR | typeof Locale.ES
export const defaultLocale: LocaleType = Locale.FR
