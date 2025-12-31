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
  updateStudySpecificExportFields: jest.fn(),
}))

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
  controlMode: ControlMode.Operational,
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
    exports: {
      types: [Export.Beges],
      control: ControlMode.Operational,
    },
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

const changeControlModeToFinancial = async (user: ReturnType<typeof userEvent.setup>) => {
  const select = screen.getByRole('combobox')
  await user.click(select)

  const financialOption = screen.getByRole('option', { name: /Financial/i })
  await user.click(financialOption)
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
        expect(mockSetControl).toHaveBeenCalledWith(ControlMode.Financial)
      })

      expect(screen.queryByTestId('control-mode-change-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning for new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckbox {...defaultProps} values={getBegesCheckedValues()} />)

      await changeControlModeToFinancial(user)

      await waitFor(() => {
        expect(mockSetControl).toHaveBeenCalledWith(ControlMode.Financial)
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
})
