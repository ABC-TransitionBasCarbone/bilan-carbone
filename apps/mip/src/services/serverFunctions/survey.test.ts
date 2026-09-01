import {
  clearSurveyState,
  loadSurveySubmissionStatus,
  saveSurveyState,
  saveSurveySubmissionStatus,
} from '@/components/survey/surveyStateStorage'
import assert from 'node:assert/strict'
import { getEntityFilterDefsFromModel } from './survey'

jest.mock('@/services/auth', () => ({
  dbActualizedAuth: jest.fn(),
}))

describe('getEntityFilterDefsFromModel', () => {
  it('ignores non-numeric suggestion values while keeping valid numeric entries sorted', async () => {
    const defs = await getEntityFilterDefsFromModel({
      'DT . filtrage': {
        suggestions: {
          'Ressources humaines': 1,
          Commercial: '3',
          Informatique: 2,
          Autres: Number.NaN,
          Direction: 4,
        },
      },
    })

    assert.deepStrictEqual(defs, [
      { name: 'Ressources humaines', value: 1 },
      { name: 'Informatique', value: 2 },
      { name: 'Direction', value: 4 },
    ])
  })
})

describe('survey state storage', () => {
  beforeEach(() => {
    clearSurveyState('survey-123')
  })

  it('persists the submitted status independently from the form state', () => {
    saveSurveyState('survey-123', { currentPageIndex: 2 })
    saveSurveySubmissionStatus('survey-123', true)

    assert.equal(loadSurveySubmissionStatus('survey-123'), true)

    clearSurveyState('survey-123')

    assert.equal(loadSurveySubmissionStatus('survey-123'), false)
  })
})
