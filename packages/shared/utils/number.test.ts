import { expect, test } from '@jest/globals'
import { countTrue, getNumericNodeValue, getPositiveNodeValue, numericValues } from '@abc-transitionbascarbone/utils/number'

test('countTrue counts matching values', () => {
    expect(countTrue([true, false, true], (value) => value)).toBe(2)
    expect(countTrue([1, 2, 3], (value) => value > 2)).toBe(1)
})

test('numericValues keeps only finite numeric values', () => {
    expect(numericValues([1, null, 3, null, 5], (value) => value)).toEqual([1, 3, 5])
    expect(
        numericValues(
            [
                { value: 10 },
                { value: null },
                { value: 20 },
            ],
            ({ value }) => value,
        ),
    ).toEqual([10, 20])
})

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
