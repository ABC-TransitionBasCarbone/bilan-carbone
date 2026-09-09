import { buildPageBuilder } from '@abc-transitionbascarbone/publicodes/form/utils'
import { describe, expect, it } from '@jest/globals'
import Engine from 'publicodes'

const model = require('../../../../prisma/seed/co2-model.FR-lang.fr-opti.json')

describe('buildPageBuilder', () => {
  it('preserves rhetorical info questions for the survey flow', () => {
    const engine = new Engine(model)
    const pages = buildPageBuilder(engine)(['bureaux . déchets . tri'])

    expect(pages.some((page) => page.elements.includes('bureaux . énergie . question rhétorique'))).toBe(true)
  })
})
