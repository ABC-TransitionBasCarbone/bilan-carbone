export enum Locale {
  FR = 'fr',
  EN = 'en',
}

export type LocaleType = typeof Locale.FR | typeof Locale.EN

export const defaultLocale: LocaleType = Locale.FR
