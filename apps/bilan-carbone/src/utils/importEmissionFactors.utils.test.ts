import { Locale } from '@/i18n/config'
import { Post } from '@/services/posts'
import { COLUMNS } from '@/types/importEmissionFactors.types'
import { expect } from '@jest/globals'
import { EmissionFactorBase, Environment, SubPost, Unit } from '@repo/db-common/enums'
import xlsx from 'node-xlsx'
import {
  buildPostsAndSubPostsCell,
  getAllPostsLabel,
  parseImportFile,
  parsePostsAndSubPostsCell,
} from './importEmissionFactors.utils'

// Ordered by COLUMNS index
type RowInput = {
  name?: string
  attribute?: string
  unit?: string
  customUnit?: string
  source?: string
  location?: string
  technicalRepresentativeness?: string
  geographicRepresentativeness?: string
  temporalRepresentativeness?: string
  completeness?: string
  reliability?: string
  comment?: string
  totalCo2?: string | number
  co2f?: string | number
  ch4f?: string | number
  ch4b?: string | number
  n2o?: string | number
  co2b?: string | number
  sf6?: string | number
  hfc?: string | number
  pfc?: string | number
  otherGES?: string | number
  postsAndSubPosts?: string
  base?: string
}

function makeBuffer(rows: RowInput[]): Buffer {
  const header = new Array(24).fill('')
  const dataRows = rows.map((r) => {
    const row = new Array(24).fill('')
    row[COLUMNS.name] = r.name ?? ''
    row[COLUMNS.attribute] = r.attribute ?? ''
    row[COLUMNS.unit] = r.unit ?? ''
    row[COLUMNS.customUnit] = r.customUnit ?? ''
    row[COLUMNS.source] = r.source ?? ''
    row[COLUMNS.location] = r.location ?? ''
    row[COLUMNS.technicalRepresentativeness] = r.technicalRepresentativeness ?? ''
    row[COLUMNS.geographicRepresentativeness] = r.geographicRepresentativeness ?? ''
    row[COLUMNS.temporalRepresentativeness] = r.temporalRepresentativeness ?? ''
    row[COLUMNS.completeness] = r.completeness ?? ''
    row[COLUMNS.reliability] = r.reliability ?? ''
    row[COLUMNS.comment] = r.comment ?? ''
    row[COLUMNS.totalCo2] = r.totalCo2 ?? ''
    row[COLUMNS.co2f] = r.co2f ?? ''
    row[COLUMNS.ch4f] = r.ch4f ?? ''
    row[COLUMNS.ch4b] = r.ch4b ?? ''
    row[COLUMNS.n2o] = r.n2o ?? ''
    row[COLUMNS.co2b] = r.co2b ?? ''
    row[COLUMNS.sf6] = r.sf6 ?? ''
    row[COLUMNS.hfc] = r.hfc ?? ''
    row[COLUMNS.pfc] = r.pfc ?? ''
    row[COLUMNS.otherGES] = r.otherGES ?? ''
    row[COLUMNS.postsAndSubPosts] = r.postsAndSubPosts ?? ''
    row[COLUMNS.base] = r.base ?? ''
    return row
  })
  const buffer = xlsx.build([{ name: 'Sheet1', data: [header, ...dataRows], options: {} }])
  return Buffer.from(buffer)
}

const QUALITY = 'Bonne'
const VALID_ROW: RowInput = {
  name: 'Mon FE',
  source: 'Source test',
  unit: 'kgCO2e/kg',
  totalCo2: 10,
  reliability: QUALITY,
  technicalRepresentativeness: QUALITY,
  geographicRepresentativeness: QUALITY,
  temporalRepresentativeness: QUALITY,
  completeness: QUALITY,
  postsAndSubPosts: 'Énergie : Combustibles fossiles',
}

describe('parsePostsAndSubPostsCell', () => {
  describe('with FR locale and BC environment', () => {
    it('returns error when cell is empty or null', () => {
      const result = parsePostsAndSubPostsCell('', Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('missingPostsAndSubPosts')
      }

      const result2 = parsePostsAndSubPostsCell(null, Locale.FR, Environment.BC)
      expect(result2.success).toBe(false)
      if (!result2.success) {
        expect(result2.errors[0].key).toBe('missingPostsAndSubPosts')
      }
    })

    it('parses a single post with one subpost', () => {
      const result = parsePostsAndSubPostsCell('Énergie : Combustibles fossiles', Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.subPosts[Post.Energies]).toEqual([SubPost.CombustiblesFossiles])
      }
    })

    it('parses a single post with multiple subposts', () => {
      const result = parsePostsAndSubPostsCell(
        'Énergie : Combustibles fossiles | Électricité',
        Locale.FR,
        Environment.BC,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.subPosts[Post.Energies]).toEqual([SubPost.CombustiblesFossiles, SubPost.Electricite])
      }
    })

    it('parses multiple post groups separated by ||', () => {
      const result = parsePostsAndSubPostsCell(
        'Énergie : Électricité || Fret : Fret entrant',
        Locale.FR,
        Environment.BC,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.subPosts[Post.Energies]).toEqual([SubPost.Electricite])
        expect(result.subPosts[Post.Fret]).toEqual([SubPost.FretEntrant])
      }
    })

    it('returns error for unknown post', () => {
      const result = parsePostsAndSubPostsCell('PostInconnu : Combustibles fossiles', Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('invalidPost')
        expect(result.errors[0].value).toBe('PostInconnu')
      }
    })

    it('returns error for unknown subpost', () => {
      const result = parsePostsAndSubPostsCell('Énergie : SousPosteInconnu', Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('invalidSubPost')
        expect(result.errors[0].value).toBe('SousPosteInconnu')
      }
    })

    it('returns error when post has no subpost', () => {
      const result = parsePostsAndSubPostsCell('Énergie :', Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('missingSubPosts')
      }
    })
  })

  describe('with getAllPostsLabel', () => {
    it('returns all subposts for the environment', () => {
      const result = parsePostsAndSubPostsCell(getAllPostsLabel(Locale.FR), Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.subPosts[Post.Energies]).toBeDefined()
        expect(result.subPosts[Post.Fret]).toBeDefined()
      }
    })
  })

  describe('with EN locale and BC environment', () => {
    it('parses multiple post groups', () => {
      const result = parsePostsAndSubPostsCell(
        'Energy : Fossil fuels || Transportation & Distribution : Upstream transportation and distribution',
        Locale.EN,
        Environment.BC,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.subPosts[Post.Energies]).toEqual([SubPost.CombustiblesFossiles])
        expect(result.subPosts[Post.Fret]).toEqual([SubPost.FretEntrant])
      }
    })
  })
})

describe('buildPostsAndSubPostsCell', () => {
  it('builds a cell from a single post with one subpost', () => {
    const result = buildPostsAndSubPostsCell([SubPost.Electricite], Locale.FR, Environment.BC)
    expect(result).toBe('Énergie : Électricité')
  })

  it('builds a cell from a single post with multiple subposts', () => {
    const result = buildPostsAndSubPostsCell(
      [SubPost.CombustiblesFossiles, SubPost.Electricite],
      Locale.FR,
      Environment.BC,
    )
    expect(result).toBe('Énergie : Combustibles fossiles | Électricité')
  })

  it('builds a cell from multiple posts', () => {
    const result = buildPostsAndSubPostsCell([SubPost.Electricite, SubPost.FretEntrant], Locale.FR, Environment.BC)
    expect(result).toBe('Énergie : Électricité || Fret : Fret entrant')
  })

  it('returns getAllPostsLabel when all env subposts are covered', () => {
    const { subPostsByPostBC } = jest.requireActual<typeof import('@/services/posts')>('@/services/posts')
    const allBC = Object.values(subPostsByPostBC).flat() as SubPost[]
    const result = buildPostsAndSubPostsCell(allBC, Locale.FR, Environment.BC)
    expect(result).toBe(getAllPostsLabel(Locale.FR))
  })

  describe('round-trip parse → build → parse', () => {
    it('preserves subposts after parse → build → parse', () => {
      const cell = 'Énergie : Électricité || Fret : Fret entrant'
      const parsed = parsePostsAndSubPostsCell(cell, Locale.FR, Environment.BC)
      expect(parsed.success).toBe(true)
      if (!parsed.success) {
        return
      }
      const subPostsFlat = Object.values(parsed.subPosts).flat()
      const rebuilt = buildPostsAndSubPostsCell(subPostsFlat, Locale.FR, Environment.BC)
      const reparsed = parsePostsAndSubPostsCell(rebuilt, Locale.FR, Environment.BC)
      expect(reparsed.success).toBe(true)
      if (reparsed.success) {
        expect(reparsed.subPosts).toEqual(parsed.subPosts)
      }
    })
  })
})

describe('parseImportFile', () => {
  describe('sheet-level errors', () => {
    it('returns emptyFile error for an empty sheet', () => {
      const buffer = xlsx.build([{ name: 'Sheet1', data: [new Array(24).fill('')], options: {} }])
      const result = parseImportFile(Buffer.from(buffer), Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('emptyFile')
      }
    })

    it('returns emptyFile error for a buffer that is not a valid xlsx', () => {
      // node-xlsx does not throw on arbitrary buffers, it just returns empty sheets
      const result = parseImportFile(Buffer.from('not a xlsx file'), Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].key).toBe('emptyFile')
      }
    })
  })

  describe('valid row', () => {
    it('parses a complete valid row and returns it', () => {
      const buffer = makeBuffer([VALID_ROW])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows).toHaveLength(1)
        const row = result.rows[0]
        expect(row.name).toBe('Mon FE')
        expect(row.source).toBe('Source test')
        expect(row.unit).toBe(Unit.KG)
        expect(row.totalCo2).toBe(10)
        expect(row.reliability).toBe(4)
        expect(row.subPosts['Energies']).toEqual([SubPost.CombustiblesFossiles])
      }
    })

    it('parses multiple valid rows', () => {
      const buffer = makeBuffer([VALID_ROW, { ...VALID_ROW, name: 'FE 2', totalCo2: 20 }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows).toHaveLength(2)
        expect(result.rows[1].totalCo2).toBe(20)
      }
    })

    it('skips rows where all cells are blank', () => {
      const buffer = makeBuffer([VALID_ROW, {}])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows).toHaveLength(1)
      }
    })

    it('returns missingName error when row has content but no name', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, name: '' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'missingName')).toBe(true)
      }
    })

    it('requires base when Electricite subpost is used', () => {
      const buffer = makeBuffer([
        {
          ...VALID_ROW,
          postsAndSubPosts: 'Énergie : Électricité',
          base: 'Location-based',
        },
      ])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].base).toBe(EmissionFactorBase.LocationBased)
      }
    })
  })

  describe('row-level validation errors', () => {
    it('returns missingSource error when source is empty', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, source: '' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'missingSource')).toBe(true)
      }
    })

    it('returns invalidUnit error for an unknown unit', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: 'poids-inconnu' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidUnit')).toBe(true)
      }
    })

    it('strips kgCO2e/ prefix from unit before mapping', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: 'kgCO2e/kg' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].unit).toBe(Unit.KG)
      }
    })

    it('strips kgCO2e/ prefix with spaces', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: 'kgCO2e / kg' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].unit).toBe(Unit.KG)
      }
    })

    it('accepts a row with customUnit prefixed with kgCO2e/ and no unit column', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: '', customUnit: 'kgCO2e/mon unité' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].unit).toBe(Unit.CUSTOM)
        expect(result.rows[0].customUnit).toBe('mon unité')
      }
    })

    it('returns invalidUnit error when customUnit is missing the kgCO2e/ prefix', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: '', customUnit: 'mon unité' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidUnit')).toBe(true)
      }
    })

    it('returns invalidUnit error when unit is missing the kgCO2e/ prefix', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: 'kg' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidUnit')).toBe(true)
      }
    })

    it('returns invalidUnit error when both unit and customUnit are empty', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, unit: '', customUnit: '' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidUnit')).toBe(true)
      }
    })

    it('returns invalidTotalCo2 error when totalCo2 is not a number', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, totalCo2: 'abc' }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidTotalCo2')).toBe(true)
      }
    })

    it('returns invalidTotalCo2 error when totalCo2 is negative', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, totalCo2: -1 }])
      const result = parseImportFile(buffer, Locale.FR, Environment.BC)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'invalidTotalCo2')).toBe(true)
      }
    })
  })
})
