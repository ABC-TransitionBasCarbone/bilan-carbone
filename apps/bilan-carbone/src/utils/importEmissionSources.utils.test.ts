import { findEmissionFactorByIdForMatch } from '@/db/emissionFactors'
import { Locale } from '@/i18n/config'
import { SOURCE_IMPORT_COLUMNS } from '@/types/importEmissionSources.types'
import {
  EmissionSourceCaracterisation,
  EmissionSourceType,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import xlsx from 'node-xlsx'
import { EmissionFactorMatchType, findEmissionFactorMatch } from './findEmissionFactor.utils'
import {
  parseEmissionSourcesFile,
  resolveEmissionFactorRows,
  SOURCE_IMPORT_HEADER_ROW_INDEX,
} from './importEmissionSources.utils'

jest.mock('@/db/emissionFactors', () => ({
  findEmissionFactorByIdForMatch: jest.fn(),
  findEmissionFactorsByNameAndUnit: jest.fn(),
  findEmissionFactorsByUnit: jest.fn(),
  findEmissionFactorByImportedIdForMatch: jest.fn(),
}))
jest.mock('./findEmissionFactor.utils', () => ({
  EmissionFactorMatchType: {
    Exact: 'exact',
    NameAndUnitOnly: 'nameAndUnitOnly',
    ValueAndUnitOnly: 'valueAndUnitOnly',
    NameAmbiguous: 'nameAmbiguous',
  },
  findEmissionFactorMatch: jest.fn(),
}))

const mockFindMatch = findEmissionFactorMatch as jest.Mock
const mockFindById = findEmissionFactorByIdForMatch as jest.Mock

const TEST_STUDY_SITES = [
  { id: 'study-site-a', site: { name: 'Site principal' } },
  { id: 'study-site-b', site: { name: 'Site secondaire' } },
]

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
  const headerRows = Array.from({ length: SOURCE_IMPORT_HEADER_ROW_INDEX + 1 }, () => new Array(colCount).fill(''))
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
    const result = parseEmissionSourcesFile(Buffer.from(buffer), Locale.FR, [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].key).toBe('emptyFile')
    }
  })

  it('returns noRows when all data rows are example rows', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, name: 'Exemple : source ignorée' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].key).toBe('noRows')
    }
  })

  it('parses a complete valid row', () => {
    const buffer = makeBuffer([VALID_ROW])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      const row = result.rows[0]
      expect(row.siteName).toBe('Site principal')
      expect(row.studySiteId).toBe('study-site-a')
      expect(row.subPost).toBe(SubPost.CombustiblesFossiles)
      expect(row.name).toBe('Ma source')
      expect(row.emissionFactorName).toBe('Facteur émission test')
    }
  })

  it('parses optional fields as undefined when empty', () => {
    const buffer = makeBuffer([VALID_ROW])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
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
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
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
    const resultYes = parseEmissionSourcesFile(bufferYes, Locale.FR, TEST_STUDY_SITES)
    const resultNo = parseEmissionSourcesFile(bufferNo, Locale.FR, TEST_STUDY_SITES)
    expect(resultYes.success && resultYes.rows[0].validated).toBe(true)
    expect(resultNo.success && resultNo.rows[0].validated).toBe(false)
  })

  it('parses quality fields to numbers (FR and EN)', () => {
    const bufferFr = makeBuffer([{ ...VALID_ROW, reliability: 'Bonne', completeness: 'Très bonne' }])
    const bufferEn = makeBuffer([{ ...VALID_ROW, subPost: 'Fossil fuels', reliability: 'Good' }])
    const resultFr = parseEmissionSourcesFile(bufferFr, Locale.FR, TEST_STUDY_SITES)
    const resultEn = parseEmissionSourcesFile(bufferEn, Locale.EN, TEST_STUDY_SITES)
    expect(resultFr.success && resultFr.rows[0].reliability).toBe(4)
    expect(resultFr.success && resultFr.rows[0].completeness).toBe(5)
    expect(resultEn.success && resultEn.rows[0].reliability).toBe(4)
  })

  it('parses type and emissionFactorUnit fields', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, type: 'Physique', emissionFactorUnit: 'kgCO2e/kg' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].type).toBe(EmissionSourceType.Physical)
      expect(result.rows[0].emissionFactorUnit).toBe(Unit.KG)
    }
  })

  it('parses a valid caracterisation', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, caracterisation: 'Opéré' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].caracterisation).toBe(EmissionSourceCaracterisation.Operated)
    }
  })

  it('accepts emissionFactorId without emissionFactorName', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorName: '', emissionFactorId: 'abc-123' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorId).toBe('abc-123')
    }
  })

  it('accepts a row without any emission factor data', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorName: '', emissionFactorId: '' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorName).toBe('')
      expect(result.rows[0].emissionFactorId).toBeUndefined()
    }
  })

  it('accepts emissionFactorUnit with kgCO2e/ prefix', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorUnit: 'kgCO2e/tonne' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorUnit).toBe(Unit.TON)
    }
  })

  it('accepts emissionFactorUnit with leading space before kgCO2e/ prefix', () => {
    const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorUnit: ' kgCO2e/tonne' }])
    const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows[0].emissionFactorUnit).toBe(Unit.TON)
    }
  })

  describe('site validation', () => {
    it('returns missingSite when the site column is empty', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: '' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toEqual([expect.objectContaining({ key: 'missingSite', lineNumber: 11 })])
      }
    })

    it('returns siteNotFound when the site is not in the study', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: 'Site inconnu' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({ key: 'siteNotFound', value: 'Site inconnu', lineNumber: 11 }),
        ])
      }
    })

    it('resolves studySiteId with a case-insensitive site name match', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: 'site principal' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].studySiteId).toBe('study-site-a')
      }
    })

    it('resolves studySiteId with a fuzzy site name match', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: 'Site pricipal' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(true)
    })
  })

  describe('row-level validation errors', () => {
    it.each([
      [{ site: '' }, 'missingSite'],
      [{ site: 'Site inconnu' }, 'siteNotFound'],
      [{ subPost: '' }, 'missingSubPost'],
      [{ subPost: 'Sous-poste inconnu' }, 'invalidSubPost'],
      [{ name: '' }, 'missingName'],
      [{ value: 'abc' }, 'invalidValue'],
      [{ emissionFactorValue: 'abc' }, 'invalidEmissionFactorValue'],
      [{ emissionFactorUnit: 'kgCO2e/unité-inconnue' }, 'invalidUnit'],
      [{ type: 'type-inconnu' }, 'invalidType'],
      [{ caracterisation: 'catégorie-inconnue' }, 'invalidCaracterisation'],
      [{ reliability: 'qualité-inconnue' }, 'invalidQuality'],
    ])('returns %s error for invalid input', (overrides, expectedError) => {
      const buffer = makeBuffer([{ ...VALID_ROW, ...overrides }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === expectedError)).toBe(true)
      }
    })

    it('accumulates multiple errors from the same row', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: '', name: '' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'missingSite')).toBe(true)
        expect(result.errors.some((e) => e.key === 'missingName')).toBe(true)
      }
    })

    it('parses a recognized emission factor unit without kgCO2e/ prefix', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, emissionFactorUnit: 'tonne' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.rows[0].emissionFactorUnit).toBe(Unit.TON)
        expect(result.rows[0].emissionFactorUnitRaw).toBe('tonne')
      }
    })

    it('returns both siteNotFound and parses unit without prefix on the same row', () => {
      const buffer = makeBuffer([{ ...VALID_ROW, site: 'Site inconnu', emissionFactorUnit: 'tonne' }])
      const result = parseEmissionSourcesFile(buffer, Locale.FR, TEST_STUDY_SITES)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.key === 'siteNotFound')).toBe(true)
        expect(result.errors.some((e) => e.key === 'invalidUnit')).toBe(false)
      }
    })
  })
})

const ORG_ID = 'org-1'
const VERSION_IDS = ['v-1']

const makeRow = (overrides: Partial<(typeof TEST_STUDY_SITES)[0]> & Record<string, unknown> = {}) =>
  ({
    lineNumber: 5,
    studySiteId: 'study-site-a',
    siteName: 'Site principal',
    subPost: 'CombustiblesFossiles',
    name: 'Ma source',
    unit: undefined,
    emissionFactorId: undefined,
    emissionFactorName: 'Acier',
    emissionFactorValue: undefined,
    emissionFactorUnit: undefined,
    emissionFactorUnitRaw: undefined,
    value: undefined,
    type: undefined,
    caracterisation: undefined,
    tag: undefined,
    source: undefined,
    reliability: undefined,
    technicalRepresentativeness: undefined,
    geographicRepresentativeness: undefined,
    temporalRepresentativeness: undefined,
    completeness: undefined,
    comment: undefined,
    feComment: undefined,
    validated: undefined,
    depreciationPeriod: undefined,
    constructionYear: undefined,
    ...overrides,
  }) as Parameters<typeof resolveEmissionFactorRows>[0][number]

describe('resolveEmissionFactorRows', () => {
  beforeEach(() => {
    mockFindMatch.mockReset()
    mockFindById.mockReset()
  })

  it('returns resolved with efId/efName from exact match', async () => {
    mockFindMatch.mockResolvedValue({
      matchType: EmissionFactorMatchType.Exact,
      id: 'prisma-1',
      importedId: 'imported-1',
      foundTitle: 'Acier recyclé',
      foundValue: 2.5,
      foundUnit: 'KG',
    })

    const result = await resolveEmissionFactorRows([makeRow()], undefined, Locale.FR, ORG_ID, VERSION_IDS)

    expect(result.type).toBe('resolved')
    if (result.type === 'resolved') {
      expect(result.resolvedByLine.get(5)).toMatchObject({ efId: 'imported-1', efName: 'Acier recyclé' })
    }
  })

  it('returns warnings with efMissing when no EF data and no match', async () => {
    mockFindMatch.mockResolvedValue(null)

    const result = await resolveEmissionFactorRows(
      [makeRow({ emissionFactorName: '' })],
      undefined,
      Locale.FR,
      ORG_ID,
      VERSION_IDS,
    )

    expect(result.type).toBe('warnings')
    if (result.type === 'warnings') {
      expect(result.warnings[0]).toMatchObject({ type: 'efMissing', lineNumber: 5 })
    }
  })

  it('returns warnings with efMissingUnit when EF name present but no unit and no match', async () => {
    mockFindMatch.mockResolvedValue(null)

    const result = await resolveEmissionFactorRows([makeRow()], undefined, Locale.FR, ORG_ID, VERSION_IDS)

    expect(result.type).toBe('warnings')
    if (result.type === 'warnings') {
      expect(result.warnings[0]).toMatchObject({ type: 'efMissingUnit', lineNumber: 5 })
    }
  })

  it('returns warnings with efNotFound when EF name and unit present but no match', async () => {
    mockFindMatch.mockResolvedValue(null)

    const result = await resolveEmissionFactorRows(
      [makeRow({ emissionFactorUnit: Unit.KG })],
      undefined,
      Locale.FR,
      ORG_ID,
      VERSION_IDS,
    )

    expect(result.type).toBe('warnings')
    if (result.type === 'warnings') {
      expect(result.warnings[0]).toMatchObject({ type: 'efNotFound', lineNumber: 5 })
    }
  })

  it('returns warnings with efNotFound and resolved when approximate match', async () => {
    mockFindMatch.mockResolvedValue({
      matchType: EmissionFactorMatchType.NameAndUnitOnly,
      id: 'prisma-1',
      importedId: 'imported-1',
      foundTitle: 'Acier approx',
      foundValue: 3,
      foundUnit: 'KG',
    })

    const result = await resolveEmissionFactorRows([makeRow()], undefined, Locale.FR, ORG_ID, VERSION_IDS)

    expect(result.type).toBe('warnings')
    if (result.type === 'warnings') {
      expect(result.warnings[0]).toMatchObject({ type: 'efNotFound', foundTitle: 'Acier approx' })
      expect(result.ambiguousRows).toHaveLength(0)
    }
  })

  it('returns ambiguous when NameAmbiguous and candidates <= MAX', async () => {
    mockFindMatch.mockResolvedValue({
      matchType: EmissionFactorMatchType.NameAmbiguous,
      candidates: [
        { id: 'ef-1', foundTitle: 'Acier A', foundValue: 2, foundUnit: 'KG' },
        { id: 'ef-2', foundTitle: 'Acier B', foundValue: 3, foundUnit: 'KG' },
      ],
    })

    const result = await resolveEmissionFactorRows([makeRow()], undefined, Locale.FR, ORG_ID, VERSION_IDS)

    expect(result.type).toBe('ambiguous')
    if (result.type === 'ambiguous') {
      expect(result.ambiguousRows[0]).toMatchObject({ lineNumber: 5, tooMany: false })
      expect(result.ambiguousRows[0].candidates).toHaveLength(2)
    }
  })

  it('sets tooMany and empties candidates when > 10 candidates', async () => {
    mockFindMatch.mockResolvedValue({
      matchType: EmissionFactorMatchType.NameAmbiguous,
      candidates: Array.from({ length: 11 }, (_, i) => ({
        id: `ef-${i}`,
        foundTitle: `FE ${i}`,
        foundValue: i,
        foundUnit: 'KG',
      })),
    })

    const result = await resolveEmissionFactorRows([makeRow()], undefined, Locale.FR, ORG_ID, VERSION_IDS)

    expect(result.type).toBe('ambiguous')
    if (result.type === 'ambiguous') {
      expect(result.ambiguousRows[0]).toMatchObject({ tooMany: true, candidates: [] })
    }
  })

  it('returns warnings with unitMissingPrefix when unit has no kgCO2e/ prefix', async () => {
    mockFindMatch.mockResolvedValue({
      matchType: EmissionFactorMatchType.Exact,
      id: 'prisma-1',
      importedId: 'imported-1',
      foundTitle: 'Acier',
      foundValue: 2,
      foundUnit: 'KG',
    })

    const result = await resolveEmissionFactorRows(
      [makeRow({ emissionFactorUnit: Unit.TON, emissionFactorUnitRaw: 'tonne' })],
      undefined,
      Locale.FR,
      ORG_ID,
      VERSION_IDS,
    )

    expect(result.type).toBe('warnings')
    if (result.type === 'warnings') {
      expect(result.warnings[0]).toMatchObject({ type: 'unitMissingPrefix', foundUnit: 'tonne' })
    }
  })

  it('skips findEmissionFactorMatch and uses chosen EF when choices provided', async () => {
    mockFindById.mockResolvedValue({
      id: 'prisma-1',
      importedId: 'imported-1',
      totalCo2: 4.2,
      unit: 'KG',
      customUnit: null,
      metaData: [{ title: 'Acier choisi', attribute: null, frontiere: null, language: 'fr' }],
    })

    const result = await resolveEmissionFactorRows([makeRow()], { 5: 'prisma-1' }, Locale.FR, ORG_ID, VERSION_IDS)

    expect(mockFindMatch).not.toHaveBeenCalled()
    expect(result.type).toBe('resolved')
    if (result.type === 'resolved') {
      expect(result.resolvedByLine.get(5)).toMatchObject({ efId: 'imported-1', efName: 'Acier choisi', efValue: '4.2' })
    }
  })

  it('does not generate warnings when resolvingChoices, even for lines not in choices', async () => {
    mockFindMatch.mockResolvedValue(null)

    const result = await resolveEmissionFactorRows(
      [makeRow({ lineNumber: 5 }), makeRow({ lineNumber: 6 })],
      { 5: null },
      Locale.FR,
      ORG_ID,
      VERSION_IDS,
    )

    expect(result.type).toBe('resolved')
  })
})
