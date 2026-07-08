export type ImportWarningCandidate = {
  id: string
  foundTitle?: string
  foundValue?: number
  foundUnit?: string
}

export type AmbiguousRow = {
  lineNumber: number
  sourceName?: string
  searchedName?: string
  searchedValue?: number
  searchedUnit?: string
  candidates: ImportWarningCandidate[]
  tooMany?: boolean
}

export type FEChoices = Record<number, string | null>

export type ImportWarning = {
  type: 'efNotFound' | 'efMissingUnit' | 'efMissing' | 'validationSkipped' | 'unitMissingPrefix' | 'tagNotFound'
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

export type Phase = 'idle' | 'warnings' | 'ambiguous' | 'preview' | 'error'
