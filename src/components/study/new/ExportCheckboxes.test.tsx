import theme from '@/environments/base/theme/theme'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { expect } from '@jest/globals'
import { ThemeProvider } from '@mui/material/styles'
import { ControlMode, EmissionSourceCaracterisation, Export } from '@prisma/client'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportCheckboxes from './ExportCheckboxes'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key
    t.rich = (key: string) => key
    return t
  },
}))
jest.mock('@/services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
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
    exports: {
      types: [],
      control: null,
    },
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

const clickBegesCheckbox = async (user: ReturnType<typeof userEvent.setup>) => {
  const checkbox = screen.getByTestId(`export-checkbox-${Export.Beges}`)
  await user.click(checkbox)
}

describe('ExportCheckboxes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('BegesActivationWarningModal', () => {
    it('should show warning when checking BEGES with validated sources on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-activation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when checking BEGES without validated sources', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.Beges])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when checking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckboxes {...defaultProps} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.Beges])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when checking BEGES on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckboxes {...defaultProps} duplicateStudyId="duplicate-study-id" study={study} />)

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

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(screen.getByTestId('beges-deactivation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when unchecking BEGES without caracterisations', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([])
      })

      expect(screen.queryByTestId('beges-deactivation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when unchecking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckboxes {...defaultProps} values={getBegesCheckedValues()} />)

      await clickBegesCheckbox(user)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([])
      })

      expect(screen.queryByTestId('beges-deactivation-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when unchecking BEGES with caracterisations on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(
        <ExportCheckboxes
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
