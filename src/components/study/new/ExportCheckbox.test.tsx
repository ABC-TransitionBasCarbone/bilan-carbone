import theme from '@/environments/base/theme/theme'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { expect } from '@jest/globals'
import { ThemeProvider } from '@mui/material/styles'
import { ControlMode, EmissionSourceCaracterisation, Export } from '@prisma/client'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportCheckbox from './ExportCheckbox'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key
    t.rich = (key: string) => key
    return t
  },
}))

jest.mock('@/hooks/useServerFunction', () => ({
  useServerFunction: () => ({
    callServerFunction: jest.fn(async (fn, options) => {
      await fn()
      options?.onSuccess?.()
    }),
  }),
}))

jest.mock('@/services/serverFunctions/study', () => ({
  updateCaracterisationsForControlMode: jest.fn(),
}))

const mockSetValues = jest.fn()
const mockOnChange = jest.fn()
const mockSetControl = jest.fn()

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

const defaultProps = {
  id: Export.Beges,
  index: 0,
  values: {
    exports: [],
    controlModde: ControlMode.Operational,
  },
  onChange: mockOnChange,
  setControl: mockSetControl,
  disabled: false,
  duplicateStudyId: null,
}

const getBegesCheckedValues = () => ({
  exports: [Export.Beges] as Export[],
  controlModde: ControlMode.Operational,
})

const getStudyWithCaracterisations = () =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: EmissionSourceCaracterisation.Operated,
        validated: false,
      }),
    ],
  })

const getStudyWithoutCaracterisations = () =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: null,
        validated: false,
      }),
    ],
  })

const getStudyWithValidatedSources = () =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: null,
        validated: true,
      }),
    ],
  })

const changeControlModeToFinancial = async (user: ReturnType<typeof userEvent.setup>) => {
  const select = screen.getByRole('combobox')
  await user.click(select)

  const financialOption = screen.getByRole('option', { name: /Financial/i })
  await user.click(financialOption)
}

const clickBegesCheckbox = async (user: ReturnType<typeof userEvent.setup>) => {
  const checkbox = screen.getByTestId(`export-checkbox-${Export.Beges}`)
  await user.click(checkbox)
}

describe('ExportCheckbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ControlModeChangeWarningModal', () => {
    it('should show warning when changing control mode with caracterisations on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await changeControlModeToFinancial(user)

      await waitFor(() => {
        expect(screen.getByTestId('control-mode-change-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when changing control mode without caracterisations', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await changeControlModeToFinancial(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: ControlMode.Financial,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('control-mode-change-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning for new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckbox {...defaultProps} values={getBegesCheckedValues()} />)

      await changeControlModeToFinancial(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: ControlMode.Financial,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('control-mode-change-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when changing control mode with caracterisations on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(
        <ExportCheckbox
          {...defaultProps}
          study={study}
          values={getBegesCheckedValues()}
          duplicateStudyId="duplicate-study-id"
        />,
      )

      await changeControlModeToFinancial(user)

      await waitFor(() => {
        expect(screen.getByTestId('control-mode-change-warning-modal')).toBeInTheDocument()
      })
    })
  })

  describe('BegesActivationWarningModal', () => {
    it('should show warning when checking BEGES with validated sources on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-activation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when checking BEGES without validated sources', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: ControlMode.Operational,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when checking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckbox {...defaultProps} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: ControlMode.Operational,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when checking BEGES on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckbox {...defaultProps} duplicateStudyId="duplicate-study-id" study={study} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-activation-warning-modal')).toBeInTheDocument()
      })
    })
  })

  describe('BegesDeactivationWarningModal', () => {
    it('should show warning when unchecking BEGES with caracterisations on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-deactivation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when unchecking BEGES without caracterisations', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckbox {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: false,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('beges-deactivation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when unchecking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckbox {...defaultProps} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          [Export.Beges]: false,
          [Export.GHGP]: false,
          [Export.ISO14069]: false,
        })
      })

      expect(screen.queryByTestId('beges-deactivation-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when unchecking BEGES with caracterisations on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(
        <ExportCheckbox
          {...defaultProps}
          study={study}
          values={getBegesCheckedValues()}
          duplicateStudyId="duplicate-study-id"
        />,
      )

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-deactivation-warning-modal')).toBeInTheDocument()
      })
    })
  })
})
