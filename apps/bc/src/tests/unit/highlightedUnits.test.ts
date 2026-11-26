import { getHighlightedUnits } from '@/environments/core/publicodes/highlightedUnits'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { isHighlightedUnit } from '@abc-transitionbascarbone/common/utils/unit'
import { expect, test } from '@jest/globals'

const tiltUnits = getHighlightedUnits(Environment.TILT)

test('isHighlightedUnit flags configured units, including untrimmed values', () => {
  expect(isHighlightedUnit('k€ HT', tiltUnits)).toBe(true)
  expect(isHighlightedUnit(' k€ HT ', tiltUnits)).toBe(true)
  expect(isHighlightedUnit('km/salarié.an', tiltUnits)).toBe(true)
})

test('isHighlightedUnit ignores other units and missing values', () => {
  expect(isHighlightedUnit('k€', tiltUnits)).toBe(false)
  expect(isHighlightedUnit('kgCO2e/k€ HT', tiltUnits)).toBe(false)
  expect(isHighlightedUnit('km/salarié.mois', tiltUnits)).toBe(false)
  expect(isHighlightedUnit('', tiltUnits)).toBe(false)
  expect(isHighlightedUnit(undefined, tiltUnits)).toBe(false)
  expect(isHighlightedUnit('k€ HT', [])).toBe(false)
})

test('getHighlightedUnits only returns units for Tilt environments', () => {
  expect(getHighlightedUnits(Environment.TILT)).toEqual(['k€ HT', 'km/salarié.an'])
  expect(getHighlightedUnits(Environment.COURSE_TILT)).toEqual(['k€ HT', 'km/salarié.an'])
  expect(getHighlightedUnits(Environment.CUT)).toEqual([])
  expect(getHighlightedUnits(Environment.CLICKSON)).toEqual([])
  expect(getHighlightedUnits(Environment.BC)).toEqual([])
})
