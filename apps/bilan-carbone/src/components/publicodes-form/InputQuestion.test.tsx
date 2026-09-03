import { InputQuestion } from '@abc-transitionbascarbone/publicodes/form'
import { render, screen } from '@testing-library/react'
import Engine from 'publicodes'

jest.mock('@abc-transitionbascarbone/publicodes/hooks', () => ({
  usePublicodesRuleTranslation: () => ({
    question: 'Question',
    description: undefined,
  }),
}))

jest.mock('@abc-transitionbascarbone/publicodes/form', () => {
  const actual = jest.requireActual('@abc-transitionbascarbone/publicodes/form')
  return {
    ...actual,
    InputField: ({ formElement }: { formElement: { id: string } }) => <div>{formElement.id}</div>,
    QuestionContainer: ({ label, description, children }: any) => (
      <div>
        <span>{label}</span>
        {description ? <span data-testid="description">{description}</span> : null}
        {children}
      </div>
    ),
  }
})

describe('InputQuestion', () => {
  it('uses the raw Publicodes description when translation is missing', () => {
    const engine = new Engine({
      'DT . voiture . utilisateur': {
        question: 'Utilisez-vous majoritairement la même voiture ?',
        description: "Cette question influe sur l'empreinte des km parcourus en voiture.",
      },
    })

    render(
      <InputQuestion
        formElement={{ id: 'DT . voiture . utilisateur', label: 'Libellé', element: 'input', type: 'text' } as any}
        onChange={jest.fn()}
        engine={engine}
      />,
    )

    expect(screen.getByTestId('description')).toHaveTextContent(
      "Cette question influe sur l'empreinte des km parcourus en voiture.",
    )
  })
})
