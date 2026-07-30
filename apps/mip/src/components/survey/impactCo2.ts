export type ImpactCo2DisplayMode = 'interstitial' | 'section'

const IMPACT_CO2_WIDGET_BY_CATEGORY: Record<ImpactCo2DisplayMode, Partial<Record<string, string>>> = {
    interstitial: {
        DT: 'transport',
        transport: 'transport',
        alimentation: 'alimentation',
        divers: 'numerique',
        logement: 'quiz',
    },
    section: {
        DT: 'transport',
        transport: 'transport',
        alimentation: 'alimentation',
        logement: 'chauffage',
    },
}

export const getImpactCo2WidgetType = (categoryKey: string, mode: ImpactCo2DisplayMode): string | undefined =>
    IMPACT_CO2_WIDGET_BY_CATEGORY[mode][categoryKey]
