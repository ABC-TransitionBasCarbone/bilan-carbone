export type ImportWarningCandidate = { foundTitle?: string; foundValue?: number; foundUnit?: string }

export type ImportWarning = {
  type: 'efNotFound' | 'efMissing' | 'validationSkipped' | 'unitMissingPrefix'
  lineNumber: number | null
  sourceName?: string
  searchedName?: string
  searchedValue?: number
  searchedUnit?: string
  foundTitle?: string
  foundValue?: number
  foundUnit?: string
  resolvedValue?: string
  candidates?: ImportWarningCandidate[]
}

export type ImportError = { lineNumber: number | null; key: string; value?: string }

export type ImportResult = { success: boolean; errors?: ImportError[]; warnings?: ImportWarning[] }
