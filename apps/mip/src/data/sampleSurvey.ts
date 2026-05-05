import { Question, Survey } from '@abc-transitionbascarbone/typeguards'

type PublicodesElement = {
  rule: string
  type: 'input'
  evaluatedElement: {
    id: string
    label: string
    description?: string
    type: 'number' | 'text' | 'boolean' | 'choice'
    unit?: string
    required: boolean
    defaultValue?: unknown
    value?: unknown
    options?: Array<{ value: string; label: string }>
  }
}

const fakePublicodesElements: PublicodesElement[] = [
  {
    rule: 'organisation . nom',
    type: 'input',
    evaluatedElement: {
      id: 'q1',
      label: 'What is your organization name?',
      description: 'Please enter the full name of your organization.',
      type: 'text',
      required: true,
    },
  },
  {
    rule: 'organisation . secteur',
    type: 'input',
    evaluatedElement: {
      id: 'q2',
      label: 'What is your primary sector of activity?',
      description: 'Select the sector that best describes your organization.',
      type: 'choice',
      required: true,
      options: [
        { value: 'industry', label: 'Industry' },
        { value: 'services', label: 'Services' },
        { value: 'agriculture', label: 'Agriculture' },
        { value: 'transport', label: 'Transport' },
        { value: 'energy', label: 'Energy' },
        { value: 'other', label: 'Other' },
      ],
    },
  },
  {
    rule: 'organisation . effectif',
    type: 'input',
    evaluatedElement: {
      id: 'q3',
      label: 'How many employees does your organization have?',
      type: 'choice',
      required: true,
      options: [
        { value: '1-10', label: '1-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-250', label: '51-250 employees' },
        { value: '251-500', label: '251-500 employees' },
        { value: '500+', label: 'More than 500 employees' },
      ],
    },
  },
  {
    rule: 'emissions . sources',
    type: 'input',
    evaluatedElement: {
      id: 'q4',
      label: 'What are your main carbon emission sources?',
      description:
        'Please describe the main sources of carbon emissions in your organization (e.g., transportation, energy consumption, manufacturing processes).',
      type: 'text',
      required: false,
    },
  },
]

function mapElementToQuestion(el: PublicodesElement): Question {
  const { evaluatedElement: e } = el
  if (e.type === 'boolean') {
    return {
      id: e.id,
      type: 'choice',
      title: e.label,
      description: e.description,
      required: e.required,
      options: [
        { value: 'true', label: 'Oui' },
        { value: 'false', label: 'Non' },
      ],
    }
  }
  if (e.type === 'choice') {
    return {
      id: e.id,
      type: 'choice',
      title: e.label,
      description: e.description,
      required: e.required,
      options: e.options ?? [],
    }
  }
  return {
    id: e.id,
    type: 'text',
    title: e.label,
    description: e.description,
    required: e.required,
    placeholder: e.unit ? `ex: 42 ${e.unit}` : undefined,
  }
}

export const sampleSurvey: Survey = {
  id: 'sample-survey-1',
  title: 'Carbon Footprint Survey',
  description: 'Help us understand your carbon footprint by answering a few questions.',
  createdAt: new Date(),
  updatedAt: new Date(),
  questions: fakePublicodesElements.map(mapElementToQuestion),
}
