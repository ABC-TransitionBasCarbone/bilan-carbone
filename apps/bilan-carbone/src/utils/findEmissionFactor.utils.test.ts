import {
  findEmissionFactorByIdForMatch,
  findEmissionFactorsByNameAndUnit,
  findEmissionFactorsByUnit,
} from '@/db/emissionFactors'
import { EfRow, findEmissionFactorMatch } from './findEmissionFactor.utils'

jest.mock('@/db/emissionFactors', () => ({
  findEmissionFactorByIdForMatch: jest.fn(),
  findEmissionFactorsByNameAndUnit: jest.fn(),
  findEmissionFactorsByUnit: jest.fn(),
}))

const mockFindById = findEmissionFactorByIdForMatch as jest.Mock
const mockFindByNameAndUnit = findEmissionFactorsByNameAndUnit as jest.Mock
const mockFindByUnit = findEmissionFactorsByUnit as jest.Mock

const locale = 'fr'
const organizationId = 'org-1'

const makeEf = (id: string, totalCo2: number, unit: string, title: string): EfRow => ({
  id,
  totalCo2,
  unit,
  customUnit: null,
  metaData: [{ title, language: locale }],
})

beforeEach(() => {
  mockFindById.mockReset()
  mockFindByNameAndUnit.mockReset()
  mockFindByUnit.mockReset()
})

describe('findEmissionFactorMatch', () => {
  describe('ID priority', () => {
    it('returns exact match when ID resolves within org', async () => {
      const ef = makeEf('ef-1', 2.5, 'KG', 'Électricité')
      mockFindById.mockResolvedValue(ef)

      const result = await findEmissionFactorMatch('ef-1', 'Électricité', 2.5, 'KG', locale, organizationId)

      expect(result).toEqual({
        matchType: 'exact',
        id: 'ef-1',
        foundTitle: 'Électricité',
        foundValue: 2.5,
        foundUnit: 'KG',
      })
      expect(mockFindById).toHaveBeenCalledWith('ef-1', organizationId)
      expect(mockFindByNameAndUnit).not.toHaveBeenCalled()
    })

    it('falls back to name+unit search when ID not found (different org)', async () => {
      mockFindById.mockResolvedValue(null)
      const ef = makeEf('ef-2', 2.5, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch('unknown-id', 'Électricité', 2.5, 'KG', locale, organizationId)

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-2' })
    })
  })

  describe('name + unit search (no ID)', () => {
    it('returns exact match when name+unit+value all match', async () => {
      const ef = makeEf('ef-1', 2.5, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(undefined, 'Électricité', 2.5, 'KG', locale, organizationId)

      expect(result).toEqual({
        matchType: 'exact',
        id: 'ef-1',
        foundTitle: 'Électricité',
        foundValue: 2.5,
        foundUnit: 'KG',
      })
    })

    it('returns nameOnly when single match by name+unit but value differs', async () => {
      const ef = makeEf('ef-1', 3.0, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(undefined, 'Électricité', 2.5, 'KG', locale, organizationId)

      expect(result).toMatchObject({ matchType: 'nameOnly', id: 'ef-1' })
    })

    it('returns nameOnly when single match and no value provided', async () => {
      const ef = makeEf('ef-1', 3.0, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(undefined, 'Électricité', undefined, 'KG', locale, organizationId)

      expect(result).toMatchObject({ matchType: 'nameOnly', id: 'ef-1' })
    })

    it('returns nameAmbiguous when multiple matches by name+unit and value matches none', async () => {
      const ef1 = makeEf('ef-1', 2.5, 'KG', 'Électricité')
      const ef2 = makeEf('ef-2', 3.0, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef1, ef2])

      const result = await findEmissionFactorMatch(undefined, 'Électricité', 9.9, 'KG', locale, organizationId)

      expect(result).toMatchObject({
        matchType: 'nameAmbiguous',
        candidates: expect.arrayContaining([
          expect.objectContaining({ id: 'ef-1' }),
          expect.objectContaining({ id: 'ef-2' }),
        ]),
      })
    })
  })

  describe('value + unit fallback', () => {
    it('returns valueAndUnitOnly when no name match but value+unit match', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 2.5, 'KG', 'Électricité')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(undefined, 'Inconnu', 2.5, 'KG', locale, organizationId)

      expect(result).toMatchObject({ matchType: 'valueAndUnitOnly', id: 'ef-1' })
    })

    it('returns null when no match at all', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      mockFindByUnit.mockResolvedValue([])

      const result = await findEmissionFactorMatch(undefined, 'Inconnu', 2.5, 'KG', locale, organizationId)

      expect(result).toBeNull()
    })

    it('returns null when no name match and no value+unit provided', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])

      const result = await findEmissionFactorMatch(undefined, 'Inconnu', undefined, undefined, locale, organizationId)

      expect(result).toBeNull()
      expect(mockFindByUnit).not.toHaveBeenCalled()
    })
  })

  describe('customUnit takes precedence over unit', () => {
    it('returns customUnit as foundUnit when set', async () => {
      const ef = { ...makeEf('ef-1', 2.5, 'KG', 'Électricité'), customUnit: 'kWh' }
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(undefined, 'Électricité', 2.5, 'KG', locale, organizationId)

      expect(result).toMatchObject({ foundUnit: 'kWh' })
    })
  })
})
