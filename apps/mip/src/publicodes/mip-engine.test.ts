import { describe, expect, it } from '@jest/globals'

import { getSurveyCategoryKeysFromRawRules } from './mip-engine'

describe('getSurveyCategoryKeysFromRawRules', () => {
    it('keeps the canonical survey category order for the real MIP model keys', () => {
        const rules = {
            DT: {},
            transport: {},
            alimentation: {},
            divers: {},
            logement: {},
        }

        expect(getSurveyCategoryKeysFromRawRules(rules)).toEqual(['DT', 'transport', 'alimentation', 'divers', 'logement'])
    })
})
