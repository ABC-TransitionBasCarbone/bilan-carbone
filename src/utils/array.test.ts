import { expect } from '@jest/globals'
import { groupBy, sortByCustomOrder } from './array'

describe('array utils functions', () => {
  describe('groupBy', () => {
    test('Should group items of an array per attribute', () => {
      const array = [
        { id: 1, groupId: 1, name: 'mocked-name-1' },
        { id: 2, groupId: 1, name: 'mocked-name-2' },
        { id: 3, groupId: 1 },
        { id: 4, groupId: 2, name: 'mocked-name-1' },
        { id: 5, groupId: 2, name: 'mocked-name-2' },
        { id: 6, groupId: 2 },
        { id: 7, groupId: 3, name: 'mocked-name-3' },
        { id: 8, groupId: 3 },
      ]
      const groupByGroupId = groupBy(array, 'groupId')
      const groupByName = groupBy(array, 'name')

      expect(Object.values(groupByGroupId)).toHaveLength(3)
      expect(groupByGroupId[1]).toBeDefined()
      expect(groupByGroupId[2]).toBeDefined()
      expect(groupByGroupId[3]).toBeDefined()
      expect(groupByGroupId[1]).toHaveLength(3)
      expect(groupByGroupId[2]).toHaveLength(3)
      expect(groupByGroupId[3]).toHaveLength(2)
      expect(groupByGroupId[1].find((item) => item.id === 1)).toBeDefined()
      expect(groupByGroupId[1].find((item) => item.id === 5)).not.toBeDefined()
      expect(groupByGroupId[2].find((item) => item.id === 5)).toBeDefined()
      expect(groupByGroupId[2].find((item) => item.id === 7)).not.toBeDefined()
      expect(groupByGroupId[3].find((item) => item.id === 7)).toBeDefined()
      expect(groupByGroupId[3].find((item) => item.id === 1)).not.toBeDefined()

      expect(Object.values(groupByName)).toHaveLength(4)
      expect(groupByName['mocked-name-1']).toBeDefined()
      expect(groupByName['mocked-name-2']).toBeDefined()
      expect(groupByName['mocked-name-3']).toBeDefined()
      expect(groupByName['undefined']).toBeDefined()
      expect(groupByName['mocked-name-1']).toHaveLength(2)
      expect(groupByName['mocked-name-2']).toHaveLength(2)
      expect(groupByName['mocked-name-3']).toHaveLength(1)
      expect(groupByName['undefined']).toHaveLength(3)
      expect(groupByName['mocked-name-1'].find((item) => item.id === 1)).toBeDefined()
      expect(groupByName['mocked-name-1'].find((item) => item.id === 5)).not.toBeDefined()
      expect(groupByName['mocked-name-2'].find((item) => item.id === 5)).toBeDefined()
      expect(groupByName['mocked-name-2'].find((item) => item.id === 7)).not.toBeDefined()
      expect(groupByName['mocked-name-3'].find((item) => item.id === 7)).toBeDefined()
      expect(groupByName['mocked-name-3'].find((item) => item.id === 1)).not.toBeDefined()
      expect(groupByName['undefined'].find((item) => item.id === 3)).toBeDefined()
      expect(groupByName['undefined'].find((item) => item.id === 4)).not.toBeDefined()
    })
  })

  describe('sortByCustomOrder', () => {
    test('Should sort array based on custom order', () => {
      const array = [
        { id: 1, name: 'b' },
        { id: 2, name: 'c' },
        { id: 3, name: 'a' },
      ]

      const customOrder = ['a', 'b', 'c']

      const sorted = sortByCustomOrder(array, customOrder, (item) => item.name)

      expect(sorted.map((item) => item.name)).toEqual(['a', 'b', 'c'])
    })

    test('Should return original order if no customOrder is provided', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ]

      const sorted = sortByCustomOrder(array, [], (item) => item.name)

      expect(sorted).toEqual(array)
    })

    test('Should still work with items not in customOrder but ignore them', () => {
      const array = [
        { id: 1, name: 'b' },
        { id: 2, name: 'x' },
        { id: 3, name: 'a' },
        { id: 4, name: 'y' },
      ]

      const customOrder = ['a', 'b', 'c']

      const sorted = sortByCustomOrder(array, customOrder, (item) => item.name)

      expect(sorted.map((item) => item.name)).toEqual(['a', 'b', 'x', 'y'])
    })
  })
})
