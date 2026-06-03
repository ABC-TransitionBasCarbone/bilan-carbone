import {
  findEmissionFactorByImportedIdForMatch,
  findEmissionFactorsByNameAndUnit,
  findEmissionFactorsByUnit,
} from '@/db/emissionFactors'
import { EfRow, findEmissionFactorMatch } from './findEmissionFactor.utils'

jest.mock('@/db/emissionFactors', () => ({
  findEmissionFactorByImportedIdForMatch: jest.fn(),
  findEmissionFactorsByNameAndUnit: jest.fn(),
  findEmissionFactorsByUnit: jest.fn(),
}))

const mockFindById = findEmissionFactorByImportedIdForMatch as jest.Mock
const mockFindByNameAndUnit = findEmissionFactorsByNameAndUnit as jest.Mock
const mockFindByUnit = findEmissionFactorsByUnit as jest.Mock

const locale = 'fr'
const organizationId = 'org-1'
const versionIds = ['v-1']

const makeEf = (
  id: string,
  totalCo2: number,
  unit: string,
  title: string,
  attribute: string | null = null,
  frontiere: string | null = null,
): EfRow => ({
  id,
  totalCo2,
  unit,
  customUnit: null,
  metaData: [{ title, attribute, frontiere, language: locale }],
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

      const result = await findEmissionFactorMatch('ef-1', 'Électricité', 2.5, 'KG', locale, organizationId, versionIds)

      expect(result).toEqual({
        matchType: 'exact',
        id: 'ef-1',
        foundTitle: 'Électricité',
        foundValue: 2.5,
        foundUnit: 'KG',
      })
      expect(mockFindById).toHaveBeenCalledWith('ef-1', organizationId, versionIds)
      expect(mockFindByNameAndUnit).not.toHaveBeenCalled()
    })

    it('falls back to name+unit search when ID not found (different org)', async () => {
      mockFindById.mockResolvedValue(null)
      const ef = makeEf('ef-2', 2.5, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        'unknown-id',
        'Électricité',
        2.5,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-2' })
    })
  })

  describe('name + unit search (no ID)', () => {
    it('returns exact match when name+unit+value all match', async () => {
      const ef = makeEf('ef-1', 2.5, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Électricité',
        2.5,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

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

      const result = await findEmissionFactorMatch(
        undefined,
        'Électricité',
        2.5,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'nameAndUnitOnly', id: 'ef-1' })
    })

    it('returns nameOnly when single match and no value provided', async () => {
      const ef = makeEf('ef-1', 3.0, 'KG', 'Électricité')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Électricité',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'nameAndUnitOnly', id: 'ef-1' })
    })

    it('returns nameAmbiguous when multiple matches by name+unit and value matches none', async () => {
      const ef1 = makeEf('ef-1', 2.5, 'KG', 'Électricité', 'France')
      const ef2 = makeEf('ef-2', 3.0, 'KG', 'Électricité', 'Allemagne')
      mockFindByNameAndUnit.mockResolvedValue([ef1, ef2])

      const result = await findEmissionFactorMatch(
        undefined,
        'Électricité',
        9.9,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

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

      const result = await findEmissionFactorMatch(undefined, 'Inconnu', 2.5, 'KG', locale, organizationId, versionIds)

      expect(result).toMatchObject({ matchType: 'valueAndUnitOnly', id: 'ef-1' })
    })

    it('returns null when no match at all', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      mockFindByUnit.mockResolvedValue([])

      const result = await findEmissionFactorMatch(undefined, 'Inconnu', 2.5, 'KG', locale, organizationId, versionIds)

      expect(result).toBeNull()
    })

    it('returns null when no name match and no value+unit provided', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])

      const result = await findEmissionFactorMatch(
        undefined,
        'Inconnu',
        undefined,
        undefined,
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toBeNull()
      expect(mockFindByUnit).not.toHaveBeenCalled()
    })
  })

  describe('fuzzy name match (no exact name+unit hit)', () => {
    it('returns nameOnly when single fuzzy match on title', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Acier ou fer blanc')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier ou fer blan',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'nameAndUnitOnly', id: 'ef-1' })
    })

    it('returns exact when fuzzy finds multiple candidates but value disambiguates', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef1 = makeEf('ef-1', 3190, 'KG', 'Acier ou fer blanc')
      const ef2 = makeEf('ef-2', 2211, 'KG', 'Acier ou fer blanc')
      const ef3 = makeEf('ef-3', 938, 'KG', 'Acier ou fer blanc')
      mockFindByUnit.mockResolvedValue([ef1, ef2, ef3])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier ou fer blan',
        938,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-3' })
    })

    it('returns exact when full name matches exactly despite multiple fuzzy candidates in byUnit pool', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef1 = makeEf('ef-1', 938, 'KG', 'Acier ou fer blanc', 'France')
      const ef2 = makeEf('ef-2', 938, 'KG', 'Acier ou fer blanc', 'Allemagne')
      mockFindByUnit.mockResolvedValue([ef1, ef2])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier ou fer blanc - France',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-1' })
    })

    it('returns nameAmbiguous when fuzzy finds multiple candidates and value matches none', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef1 = makeEf('ef-1', 3190, 'KG', 'Acier ou fer blanc')
      const ef2 = makeEf('ef-2', 2211, 'KG', 'Acier ou fer blanc')
      mockFindByUnit.mockResolvedValue([ef1, ef2])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier ou fer blan',
        999,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({
        matchType: 'nameAmbiguous',
        candidates: expect.arrayContaining([
          expect.objectContaining({ id: 'ef-1' }),
          expect.objectContaining({ id: 'ef-2' }),
        ]),
      })
    })

    it('falls through to valueAndUnitOnly when fuzzy finds no title match but value matches', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 2.5, 'KG', 'Électricité réseau')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Inconnu total',
        2.5,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'valueAndUnitOnly', id: 'ef-1' })
    })

    it('returns null when fuzzy finds no match and no value', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      mockFindByUnit.mockResolvedValue([makeEf('ef-1', 2.5, 'KG', 'Électricité réseau')])

      const result = await findEmissionFactorMatch(
        undefined,
        'Inconnu total',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toBeNull()
    })

    it('tolerates accents and plural difference (Batiments vs Bâtiments)', async () => {
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 100, 'KG', 'Bâtiments')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Batiment',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'nameAndUnitOnly', id: 'ef-1' })
    })
  })

  describe('version isolation', () => {
    it('returns null when EF is not in study versions (DB returns nothing)', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      mockFindByUnit.mockResolvedValue([])

      const result = await findEmissionFactorMatch('ef-1', 'Électricité', 2.5, 'KG', locale, organizationId, [
        'other-version',
      ])

      expect(result).toBeNull()
    })
  })

  describe('customUnit takes precedence over unit', () => {
    it('returns customUnit as foundUnit when set', async () => {
      const ef = { ...makeEf('ef-1', 2.5, 'KG', 'Électricité'), customUnit: 'kWh' }
      mockFindByNameAndUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Électricité',
        2.5,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ foundUnit: 'kWh' })
    })
  })

  describe('full name fuzzy detection (normalized)', () => {
    it('finds EF when import name is "title - frontiere" via normalized Fuse match', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Acier', null, 'Neuf')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier - Neuf',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-1' })
    })

    it('finds EF when import name is "title - attribute - frontiere" and returns full name as foundTitle', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Emballages', 'Acier', 'Stockage - Impacts')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Emballages - Acier - Stockage - Impacts',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({
        matchType: 'exact',
        id: 'ef-1',
        foundTitle: 'Emballages - Acier - Stockage - Impacts',
      })
    })

    it('matches without dashes (normalized comparison ignores punctuation)', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Acier ou fer blanc', null, 'Neuf')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier ou fer blanc Neuf',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-1' })
    })

    it('matches despite extra spaces around dashes', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Acier', null, 'Neuf')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Acier  -  Neuf',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'exact', id: 'ef-1' })
    })

    it('still calls findEmissionFactorsByNameAndUnit once with raw trimmed title', async () => {
      mockFindById.mockResolvedValue(null)
      const ef = makeEf('ef-1', 938, 'KG', 'Acier')
      mockFindByNameAndUnit.mockResolvedValue([ef])

      await findEmissionFactorMatch(undefined, 'Acier', 938, 'KG', locale, organizationId, versionIds)

      expect(mockFindByNameAndUnit).toHaveBeenCalledTimes(1)
      expect(mockFindByNameAndUnit).toHaveBeenCalledWith('Acier', locale, organizationId, 'KG', versionIds)
    })

    it('finds EF with fuzzy typo on full name with attribute (truncated attribute)', async () => {
      mockFindById.mockResolvedValue(null)
      mockFindByNameAndUnit.mockResolvedValue([])
      const ef = makeEf('ef-1', 938, 'KG', 'Emballages', 'Carton', 'Recyclé')
      mockFindByUnit.mockResolvedValue([ef])

      const result = await findEmissionFactorMatch(
        undefined,
        'Emballages - Cart - Recyclé',
        undefined,
        'KG',
        locale,
        organizationId,
        versionIds,
      )

      expect(result).toMatchObject({ matchType: 'nameAndUnitOnly', id: 'ef-1' })
    })
  })
})
