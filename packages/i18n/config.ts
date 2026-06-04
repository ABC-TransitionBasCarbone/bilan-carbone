export enum Locale {
  EN = 'en',
  FR = 'fr',
  ES = 'es',

  IT = 'it',
  RO = 'ro',
  HR = 'hr',
  HU = 'hu',
  EL = 'el',
}

export type LocaleType =
  | typeof Locale.EN
  | typeof Locale.FR
  | typeof Locale.ES
  | typeof Locale.IT
  | typeof Locale.RO
  | typeof Locale.HR
  | typeof Locale.HU
  | typeof Locale.EL
export const defaultLocale: LocaleType = Locale.FR
