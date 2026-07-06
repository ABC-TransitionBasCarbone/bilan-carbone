import { CATEGORY_COLORS, KeyStatGroup, SurveyResults } from '@/data/sampleResults'
import { createMipEngine, RawRules } from '@/publicodes/mip-engine'
import { FormState } from '@publicodes/forms'
import { Situation } from 'publicodes'

type StoredResponse = {
    id: string
    answers: unknown
}

type CategoryDefinition = {
    key: string
    rule: string
}

type StatDefinition = {
    key: string
    rule: string
    unit: 'percent' | 'number'
}

const CATEGORIES: CategoryDefinition[] = [
    { key: 'commute', rule: 'DT' },
    { key: 'travel', rule: 'transport' },
    { key: 'food', rule: 'alimentation' },
    { key: 'digital', rule: 'divers' },
    { key: 'office', rule: 'logement' },
]

const KEY_STATS: Array<{ key: string; stats: StatDefinition[] }> = [
    {
        key: 'transport',
        stats: [
            { key: 'plane', rule: 'transport . avion . présent', unit: 'percent' },
            { key: 'longHaulPlane', rule: 'transport . avion . long courrier . heures de vol', unit: 'percent' },
            { key: 'carKm', rule: 'DT . voiture . km', unit: 'number' },
            { key: 'carPassengers', rule: 'DT . voiture . voyageurs', unit: 'number' },
        ],
    },
    {
        key: 'housing',
        stats: [
            { key: 'electricHeating', rule: 'logement . chauffage . électricité . présent', unit: 'percent' },
            { key: 'gasHeating', rule: 'logement . chauffage . gaz . présent', unit: 'percent' },
            { key: 'oilHeating', rule: 'logement . chauffage . fioul . présent', unit: 'percent' },
            { key: 'woodHeating', rule: 'logement . chauffage . bois . présent', unit: 'percent' },
            { key: 'airConditioning', rule: 'logement . climatisation . présent', unit: 'percent' },
        ],
    },
    {
        key: 'food',
        stats: [
            { key: 'vegan', rule: 'alimentation . plats . végétalien . nombre', unit: 'percent' },
            { key: 'redMeatDaily', rule: 'alimentation . plats . viande rouge . nombre', unit: 'percent' },
            { key: 'localSeasonal', rule: 'alimentation . de saison . consommation', unit: 'percent' },
            { key: 'bottledWater', rule: 'alimentation . boisson . eau en bouteille . consommateur', unit: 'percent' },
            { key: 'zeroWaste', rule: 'alimentation . déchets . gestes', unit: 'percent' },
        ],
    },
    {
        key: 'misc',
        stats: [
            { key: 'newClothes', rule: 'divers . autres produits . niveau de dépenses', unit: 'number' },
            { key: 'socialMediaOver3h', rule: 'divers . réseaux sociaux . niveau de consommation', unit: 'percent' },
        ],
    },
]

const numberFromNodeValue = (value: unknown): number => {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
        return 0
    }
    return Math.max(0, value)
}

const average = (values: number[]): number => {
    if (!values.length) {
        return 0
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length
}

const toPercentValue = (nodeValue: unknown): number => {
    if (typeof nodeValue === 'boolean') {
        return nodeValue ? 1 : 0
    }
    if (typeof nodeValue === 'number') {
        return nodeValue > 0 ? 1 : 0
    }
    if (typeof nodeValue === 'string') {
        return nodeValue.trim() ? 1 : 0
    }
    return 0
}

const evaluateNodeValue = (engine: ReturnType<typeof createMipEngine>, rule: string): unknown => {
    try {
        return engine.evaluate(rule).nodeValue
    } catch {
        return 0
    }
}

const readSituation = (answers: unknown): Situation<string> | null => {
    let parsed = answers

    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed)
        } catch {
            return null
        }
    }

    if (!parsed || typeof parsed !== 'object') {
        return null
    }

    const state = parsed as Partial<FormState<string>>
    if (!state.situation || typeof state.situation !== 'object') {
        return null
    }

    return state.situation as Situation<string>
}

const buildEmptyResults = (surveyId: string): SurveyResults => ({
    surveyId,
    totalRespondents: 0,
    averageFootprint: 0,
    categories: CATEGORIES.map((category) => ({
        key: category.key,
        labelFr: category.key,
        value: 0,
        color: CATEGORY_COLORS[category.key],
    })),
    entities: [{ id: 'all', name: 'Tous' }],
    comments: [],
    keyStats: KEY_STATS.map((group) => ({
        key: group.key,
        stats: group.stats.map((stat) => ({
            key: stat.key,
            value: 0,
            unit: stat.unit,
        })),
    })),
})

export const buildCampaignResults = ({
    surveyId,
    model,
    responses,
}: {
    surveyId: string
    model: RawRules
    responses: StoredResponse[]
}): SurveyResults => {
    const situations = responses
        .map((response) => readSituation(response.answers))
        .filter((value): value is Situation<string> => !!value)

    if (situations.length === 0) {
        return buildEmptyResults(surveyId)
    }

    const engine = createMipEngine(model)

    const totalByCategory = new Map<string, number>(CATEGORIES.map((category) => [category.key, 0]))
    const totalValues: number[] = []
    const statsValues = new Map<string, number[]>()

    for (const group of KEY_STATS) {
        for (const stat of group.stats) {
            statsValues.set(stat.key, [])
        }
    }

    for (const situation of situations) {
        engine.setSituation(situation)

        totalValues.push(numberFromNodeValue(evaluateNodeValue(engine, 'bilan')))

        for (const category of CATEGORIES) {
            const value = numberFromNodeValue(evaluateNodeValue(engine, category.rule))
            totalByCategory.set(category.key, (totalByCategory.get(category.key) ?? 0) + value)
        }

        for (const group of KEY_STATS) {
            for (const stat of group.stats) {
                const nodeValue = evaluateNodeValue(engine, stat.rule)
                const values = statsValues.get(stat.key)
                if (!values) {
                    continue
                }

                if (stat.unit === 'percent') {
                    values.push(toPercentValue(nodeValue))
                } else {
                    values.push(numberFromNodeValue(nodeValue))
                }
            }
        }
    }

    const keyStats: KeyStatGroup[] = KEY_STATS.map((group) => ({
        key: group.key,
        stats: group.stats.map((stat) => {
            const values = statsValues.get(stat.key) ?? []
            if (stat.unit === 'percent') {
                return {
                    key: stat.key,
                    unit: stat.unit,
                    value: Math.round(average(values) * 100),
                }
            }

            const avg = average(values)
            return {
                key: stat.key,
                unit: stat.unit,
                value: avg >= 10 ? Math.round(avg) : Number(avg.toFixed(1)),
            }
        }),
    }))

    return {
        surveyId,
        totalRespondents: situations.length,
        averageFootprint: Math.round(average(totalValues)),
        categories: CATEGORIES.map((category) => ({
            key: category.key,
            labelFr: category.key,
            value: Math.round((totalByCategory.get(category.key) ?? 0) / situations.length),
            color: CATEGORY_COLORS[category.key],
        })),
        entities: [{ id: 'all', name: 'Tous' }],
        comments: [],
        keyStats,
    }
}
