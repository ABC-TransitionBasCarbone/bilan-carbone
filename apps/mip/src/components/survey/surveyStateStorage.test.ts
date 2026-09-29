import { describe, expect, it } from '@jest/globals'
import { FormBuilder } from '@publicodes/forms'
import { isRestorableSurveyState } from './surveyStateStorage'

describe('isRestorableSurveyState', () => {
  it('accepts an initialized form page', () => {
    const state = { ...FormBuilder.newState(), pages: [{ elements: ['bilan'] }], currentPageIndex: 0 }
    expect(isRestorableSurveyState(state, { bilan: {} })).toBe(true)
  })

  it('rejects legacy and out-of-range saved states', () => {
    expect(isRestorableSurveyState({ currentPageIndex: 0 }, { bilan: {} })).toBe(false)
    expect(isRestorableSurveyState({ ...FormBuilder.newState(), currentPageIndex: 0 }, { bilan: {} })).toBe(false)
    expect(
      isRestorableSurveyState(
        { ...FormBuilder.newState(), pages: [{ elements: ['removed-rule'] }], currentPageIndex: 0 },
        { bilan: {} },
      ),
    ).toBe(false)
  })
})
