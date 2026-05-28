export type ImportWarningCandidate = { foundTitle?: string; foundValue?: number; foundUnit?: string }

export type ImportWarning = {
  type: 'efNotFound' | 'efMissing' | 'validationSkipped'
  lineNumber: number
  sourceName?: string
  searchedName?: string
  searchedValue?: number
  searchedUnit?: string
  foundTitle?: string
  foundValue?: number
  foundUnit?: string
  candidates?: ImportWarningCandidate[]
}

export type ImportError = { lineNumber: number; key: string; value?: string }

export type ImportResult = { success: boolean; errors?: ImportError[]; warnings?: ImportWarning[] }
