import { expect, test } from '@jest/globals'
import { getNumericNodeValue, getPositiveNodeValue } from '@abc-transitionbascarbone/utils/number'

test('getNumericNodeValue returns a finite number or 0', () => {
    expect(getNumericNodeValue(12.5)).toBe(12.5)
    expect(getNumericNodeValue('12.5')).toBe(0)
    expect(getNumericNodeValue(undefined)).toBe(0)
})

test('getPositiveNodeValue clamps negatives to zero', () => {
    expect(getPositiveNodeValue(12.5)).toBe(12.5)
    expect(getPositiveNodeValue(-3)).toBe(0)
    expect(getPositiveNodeValue('bad')).toBe(0)
})
