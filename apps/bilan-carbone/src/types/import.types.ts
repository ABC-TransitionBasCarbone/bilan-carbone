export type ImportWarningCandidate = { foundTitle?: string; foundValue?: number; foundUnit?: string }

export type ImportWarning = {
  type: 'efNotFound' | 'efMissing' | 'validationSkipped'
  line: number
  sourceName?: string
  searchedName?: string
  searchedValue?: number
  searchedUnit?: string
  foundTitle?: string
  foundValue?: number
  foundUnit?: string
  candidates?: ImportWarningCandidate[]
}

export type ImportError = { line: number; key: string; value?: string }

export type ImportResult = { success: boolean; errors?: ImportError[]; warnings?: ImportWarning[] }
