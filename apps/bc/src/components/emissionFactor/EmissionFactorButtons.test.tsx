import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmissionFactorButtons from './EmissionFactorButtons'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/facteurs-d-emission',
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('@/services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/serverFunctions/importEmissionFactors', () => ({
  exportManualEmissionFactorsToFile: jest.fn(),
}))
jest.mock('@abc-transitionbascarbone/common/ui', () => ({
  ...jest.requireActual('@abc-transitionbascarbone/common/ui'),
  useToast: () => ({ showSuccessToast: jest.fn() }),
}))

describe('EmissionFactorButtons', () => {
  it('disables access to creation, import and export without creation rights', () => {
    render(<EmissionFactorButtons disabled />)

    const button = screen.getByTestId('emission-factors-menu')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('allows authorized users to open the creation, import and export menu', async () => {
    render(<EmissionFactorButtons disabled={false} />)

    const button = screen.getByTestId('emission-factors-menu')
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(screen.getByRole('menuitem', { name: 'add' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'import' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'export' })).toBeInTheDocument()
  })
})
