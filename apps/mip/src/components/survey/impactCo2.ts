import { removeDiacritics } from '@abc-transitionbascarbone/utils/parsing'

export type ImpactCo2DisplayMode = 'interstitial' | 'section'

const IMPACT_CO2_WIDGET_BY_CATEGORY: Record<ImpactCo2DisplayMode, Partial<Record<string, string>>> = {
  interstitial: {
    DT: 'transport',
    transport: 'transport',
    alimentation: 'alimentation',
    divers: 'numerique',
    numerique: 'numerique',
    logement: 'quiz',
    bureaux: 'quiz',
  },
  section: {
    DT: 'transport',
    transport: 'transport',
    alimentation: 'alimentation',
    logement: 'chauffage',
    bureaux: 'chauffage',
  },
}

const normalizeCategoryKey = (categoryKey: string): string => removeDiacritics(categoryKey).trim().toLowerCase()

const CATEGORY_KEY_ALIASES: Record<string, string> = {
  numerique: 'numerique',
  deplacements: 'transport',
}

const resolveCategoryKey = (categoryKey: string): string => {
  const normalized = normalizeCategoryKey(categoryKey)
  return CATEGORY_KEY_ALIASES[normalized] ?? normalized
}

const DEFAULT_WIDGET_BY_MODE: Partial<Record<ImpactCo2DisplayMode, string>> = {
  interstitial: 'transport',
}

export const getImpactCo2WidgetType = (categoryKey: string, mode: ImpactCo2DisplayMode): string | undefined => {
  const direct = IMPACT_CO2_WIDGET_BY_CATEGORY[mode][categoryKey]
  if (direct) {
    return direct
  }

  const resolvedKey = resolveCategoryKey(categoryKey)
  const resolved = IMPACT_CO2_WIDGET_BY_CATEGORY[mode][resolvedKey]
  if (resolved) {
    return resolved
  }

  return DEFAULT_WIDGET_BY_MODE[mode]
}
