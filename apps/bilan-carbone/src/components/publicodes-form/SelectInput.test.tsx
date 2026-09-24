import type { EvaluatedSelect } from '@publicodes/forms'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@abc-transitionbascarbone/publicodes/hooks', () => ({
  usePublicodesRuleTranslation: () => ({
    getOptionLabel: (value: string) => String(value),
  }),
}))

const SelectInput = require('../../../../../packages/publicodes/form/inputFields/SelectInput').default

describe('SelectInput', () => {
  it('does not display option descriptions inline in the dropdown', async () => {
    const formElement: EvaluatedSelect<string> = {
      id: 'DT . voiture . carburant',
      label: 'Carburant',
      element: 'select',
      options: [
        { value: 'essence', label: 'Essence', description: 'Description visible de l’option essence.' },
        { value: 'diesel', label: 'Diesel', description: 'Description visible de l’option diesel.' },
      ],
      value: undefined,
      defaultValue: undefined,
    } as EvaluatedSelect<string>

    render(<SelectInput formElement={formElement} onChange={jest.fn()} onBlur={jest.fn()} />)

    await userEvent.click(screen.getByRole('combobox'))

    expect(screen.queryByText('Description visible de l’option essence.')).not.toBeInTheDocument()
    expect(screen.queryByText('Description visible de l’option diesel.')).not.toBeInTheDocument()
  })
})
