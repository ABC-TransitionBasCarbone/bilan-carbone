import type { EvaluatedFormElement } from '@publicodes/forms'
import { render, screen } from '@testing-library/react'
import Engine from 'publicodes'
import type { ReactNode } from 'react'
import { InputQuestion } from '../../../../../packages/publicodes/form/InputQuestion'

type MockQuestionContainerProps = {
  label: ReactNode
  description?: ReactNode
  children: ReactNode
}

const formElement: EvaluatedFormElement<string> = {
  id: 'DT . voiture . utilisateur',
  label: 'Libelle',
  element: 'input',
  type: 'text',
} as EvaluatedFormElement<string>

jest.mock('@abc-transitionbascarbone/publicodes/hooks', () => ({
  usePublicodesRuleTranslation: () => ({
    question: 'Question',
    description: undefined,
  }),
}))

jest.mock('../../../../../packages/publicodes/form/InputField', () => ({
  InputField: ({ formElement }: { formElement: { id: string } }) => <div>{formElement.id}</div>,
}))

jest.mock('../../../../../packages/publicodes/form/QuestionContainer', () => ({
  QuestionContainer: ({ label, description, children }: MockQuestionContainerProps) => (
    <div>
      <span>{label}</span>
      {description ? <span data-testid="description">{description}</span> : null}
      {children}
    </div>
  ),
}))

describe('InputQuestion', () => {
  it('uses the raw Publicodes description when translation is missing', () => {
    const engine = new Engine({
      DT: {
        'voiture . utilisateur': null,
      },
      'DT . voiture': {
        utilisateur: null,
      },
      'DT . voiture . utilisateur': {
        question: 'Utilisez-vous majoritairement la même voiture ?',
        description: "Cette question influe sur l'empreinte des km parcourus en voiture.",
      },
    })

    render(<InputQuestion formElement={formElement} onChange={jest.fn()} engine={engine} />)

    expect(screen.getByTestId('description')).toHaveTextContent(
      "Cette question influe sur l'empreinte des km parcourus en voiture.",
    )
  })
})
