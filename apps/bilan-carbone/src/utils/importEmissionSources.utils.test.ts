import { Locale } from '@/i18n/config'
import { SOURCE_IMPORT_COLUMNS } from '@/types/importEmissionSources.types'
import { EmissionSourceType, SubPost, Unit } from '@abc-transitionbascarbone/db-common/enums'
import xlsx from 'node-xlsx'
import { parseEmissionSourcesFile } from './importEmissionSources.utils'

type RowInput = {
  site?: string
  subPost?: string
  name?: string
  tag?: string
  caracterisation?: string
  value?: string | number
  unit?: string
  depreciationPeriod?: string | number
  constructionYear?: string | number
  reliability?: string
  technicalRepresentativeness?: string
  geographicRepresentativeness?: string
  temporalRepresentativeness?: string
  completeness?: string
  source?: string
  type?: string
  comment?: string
  emissionFactorId?: string
  emissionFactorName?: string
  emissionFactorValue?: string | number
  emissionFactorUnit?: string
  feComment?: string
  validation?: string
}

function makeBuffer(rows: RowInput[]): Buffer {
  const colCount = 35
  const headerRows = Array.from({ length: 9 }, () => new Array(colCount).fill(''))
  const dataRows = rows.map((r) => {
    const row = new Array(colCount).fill('')
    row[SOURCE_IMPORT_COLUMNS.site] = r.site ?? ''
    row[SOURCE_IMPORT_COLUMNS.subPost] = r.subPost ?? ''
    row[SOURCE_IMPORT_COLUMNS.name] = r.name ?? ''
    row[SOURCE_IMPORT_COLUMNS.tag] = r.tag ?? ''
    row[SOURCE_IMPORT_COLUMNS.caracterisation] = r.caracterisation ?? ''
    row[SOURCE_IMPORT_COLUMNS.value] = r.value ?? ''
    row[SOURCE_IMPORT_COLUMNS.unit] = r.unit ?? ''
    row[SOURCE_IMPORT_COLUMNS.depreciationPeriod] = r.depreciationPeriod ?? ''
    row[SOURCE_IMPORT_COLUMNS.constructionYear] = r.constructionYear ?? ''
    row[SOURCE_IMPORT_COLUMNS.reliability] = r.reliability ?? ''
    row[SOURCE_IMPORT_COLUMNS.technicalRepresentativeness] = r.technicalRepresentativeness ?? ''
    row[SOURCE_IMPORT_COLUMNS.geographicRepresentativeness] = r.geographicRepresentativeness ?? ''
    row[SOURCE_IMPORT_COLUMNS.temporalRepresentativeness] = r.temporalRepresentativeness ?? ''
    row[SOURCE_IMPORT_COLUMNS.completeness] = r.completeness ?? ''
    row[SOURCE_IMPORT_COLUMNS.source] = r.source ?? ''
    row[SOURCE_IMPORT_COLUMNS.type] = r.type ?? ''
    row[SOURCE_IMPORT_COLUMNS.comment] = r.comment ?? ''
    row[SOURCE_IMPORT_COLUMNS.emissionFactorId] = r.emissionFactorId ?? ''
    row[SOURCE_IMPORT_COLUMNS.emissionFactorName] = r.emissionFactorName ?? ''
    row[SOURCE_IMPORT_COLUMNS.emissionFactorValue] = r.emissionFactorValue ?? ''
    row[SOURCE_IMPORT_COLUMNS.emissionFactorUnit] = r.emissionFactorUnit ?? ''
    row[SOURCE_IMPORT_COLUMNS.feComment] = r.feComment ?? ''
    row[SOURCE_IMPORT_COLUMNS.validation] = r.validation ?? ''
    return row
  })
  const buffer = xlsx.build([{ name: 'Sheet1', data: [...headerRows, ...dataRows], options: {} }])
  return Buffer.from(buffer)
}

const VALID_ROW: RowInput = {
  site: 'Site principal',
  subPost: 'Combustibles fossiles',
  name: 'Ma source',
  emissionFactorName: 'Facteur émission test',
}

describe('parseEmissionSourcesFile', () => {
  it('returns emptyFile error for an empty sheet', () => {
    const buffer = xlsx.build([{ name: 'Sheet1', data: [new Array(35).fill('')], options: {} }])
    const result = parseEmissionSourcesFile(Buffer.from(buffer), Locale.FR)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].key).toBe('emptyFile')
    }
  })

  it('returns noRows when all data rows are example rows', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, name: 'Exemple : source ignorée' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].key).toBe('noRows')
    }
  })

  it('parses a complete valid row', () => {
    const buffer = makeBuffer([VALID_ROW])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      const row = result.rows[0]
      expect(row.siteName).toBe('Site principal')
      expect(row.subPost).toBe(SubPost.CombustiblesFossiles)
      expect(row.name).toBe('Ma source')
      expect(row.emissionFactorName).toBe('Facteur émission test')
    }
  })

  it('parses optional fields as undefined when empty', () => {
    const buffer = makeBuffer([VALID_ROW])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      const row = result.rows[0]
      expect(row.value).toBeUndefined()
      expect(row.depreciationPeriod).toBeUndefined()
      expect(row.constructionYear).toBeUndefined()
      expect(row.validated).toBeUndefined()
    }
  })

  it('parses numeric optional fields', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, depreciationPeriod: '10', constructionYear: '2010', value: '42' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].depreciationPeriod).toBe(10)
      expect(result.rows[0].constructionYear).toBe(2010)
      expect(result.rows[0].value).toBe(42)
    }
  })

  it('parses validated from yes/no translation', () => {
    const bufferYes = makeBuffer([{ ...VALID_ROW, validation: 'Oui' }])
    const bufferNo = makeBuffer([{ ...VALID_ROW, validation: 'Non' }])
    const resultYes = parseEmissionSourcesFile(bufferYes, Locale.FR)
    const resultNo = parseEmissionSourcesFile(bufferNo, Locale.FR)
    expect(resultYes.success && resultYes.rows[0].validated).toBe(true)
    expect(resultNo.success && resultNo.rows[0].validated).toBe(false)
  })

  it('parses quality fields to numbers (FR and EN)', () => {
    const bufferFr = makeBuffer([{ ...VALID_ROW, reliability: 'Bonne', completeness: 'Très bonne' }])
    const bufferEn = makeBuffer([{ ...VALID_ROW, subPost: 'Fossil fuels', reliability: 'Good' }])
    const resultFr = parseEmissionSourcesFile(bufferFr, Locale.FR)
    const resultEn = parseEmissionSourcesFile(bufferEn, Locale.EN)
    expect(resultFr.success && resultFr.rows[0].reliability).toBe(4)
    expect(resultFr.success && resultFr.rows[0].completeness).toBe(5)
    expect(resultEn.success && resultEn.rows[0].reliability).toBe(4)
  })

  it('parses type and emissionFactorUnit fields', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, type: 'Physique', emissionFactorUnit: 'kg' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].type).toBe(EmissionSourceType.Physical)
      expect(result.rows[0].emissionFactorUnit).toBe(Unit.KG)
    }
  })

  it('accepts emissionFactorId without emissionFactorName', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorName: '', emissionFactorId: 'abc-123' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorId).toBe('abc-123')
    }
  })

  it('accepts a row without any emission factor data', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorName: '', emissionFactorId: '' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorName).toBe('')
      expect(result.rows[0].emissionFactorId).toBeUndefined()
    }
  })

  it('accepts emissionFactorUnit with kgCO2e/ prefix', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorUnit: 'kgCO2e/tonne' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorUnit).toBe(Unit.TON)
    }
  })

  describe('row-level validation errors', () => {
    it.each([
      [{ site: '' }, 'missingSite'],
      [{ subPost: '' }, 'missingSubPost'],
      [{ subPost: 'Sous-poste inconnu' }, 'invalidSubPost'],
      [{ name: '' }, 'missingName'],
      [{ value: 'abc' }, 'invalidValue'],
      [{ emissionFactorValue: 'abc' }, 'invalidEmissionFactorValue'],
      [{ emissionFactorUnit: 'unité-inconnue' }, 'invalidUnit'],
      [{ type: 'type-inconnu' }, 'invalidType'],
      [{ caracterisation: 'catégorie-inconnue' }, 'invalidCaracterisation'],
      [{ reliability: 'qualité-inconnue' }, 'invalidQuality'],
    ])('returns %s error for invalid input', (overrides, expectedError) => {
      const buffer = makeBuffer([{ ...VALID_ROW, ...overrides }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === expectedError)).toBe(true)
      }
    })

    it('accumulates multiple errors from the same row', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: '', name: '' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'missingSite')).toBe(true)
        expect(result.errors.some((e) => e.key === 'missingName')).toBe(true)
      }
    })
  })
})
