import { BASE, Environment } from '@/store/AppEnvironment'

export enum Locale {
  EN = 'en',
  FR = 'fr',
}

export type LocaleType = typeof Locale.EN | typeof Locale.FR
export const defaultLocale: LocaleType = Locale.FR

export const defaultEnvironment: Environment = BASE
