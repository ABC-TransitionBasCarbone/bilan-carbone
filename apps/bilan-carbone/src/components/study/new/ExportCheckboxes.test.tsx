import theme from '@/environments/base/theme/theme'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { getAllSpecificFieldsForExports } from '@/utils/study'
import { ControlMode, EmissionSourceCaracterisation, Export } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { ThemeProvider } from '@mui/material/styles'
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
  adaptFeSourceWithExport: jest.fn(),
}))

jest.mock('@/utils/study', () => ({
  getAllSpecificFieldsForExports: jest.fn(),
  exportSpecificFields: {
    Beges: ['caracterisation'],
    GHGP: ['caracterisation', 'constructionYear'],
    ISO14069: [],
  },
}))

const mockGetAllSpecificFieldsForExports = getAllSpecificFieldsForExports as jest.MockedFunction<
  typeof getAllSpecificFieldsForExports
>

mockGetAllSpecificFieldsForExports.mockImplementation((exports: Export[]): (keyof UpdateEmissionSourceCommand)[] => {
  const exportsKey = JSON.stringify(exports.sort())

  const mockResults: Record<string, string[]> = {
    [JSON.stringify(['Beges'])]: ['caracterisation'],
    [JSON.stringify(['GHGP'])]: ['caracterisation', 'constructionYear'],
    [JSON.stringify(['Beges', 'GHGP'].sort())]: ['caracterisation', 'constructionYear'],
    [JSON.stringify([])]: [],
  }

  return (mockResults[exportsKey] as (keyof UpdateEmissionSourceCommand)[]) || []
})

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

const getExportCheckedValues = (exports: Export[]) => ({
  exports,
  controlMode: ControlMode.Operational,
})

const getStudyWithCaracterisations = (exportTypes: Export[] = [Export.Beges]) =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: EmissionSourceCaracterisation.Operated,
        validated: false,
      }),
    ],
    exports: {
      types: exportTypes,
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

const getStudyWithValidatedSourcesAndCaracterisations = (exportTypes: Export[]) =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: EmissionSourceCaracterisation.Operated,
        validated: true,
      }),
    ],
    exports: {
      types: exportTypes,
      control: ControlMode.Operational,
    },
  })

const getStudyWithValidatedSourcesAndCaracterisationsAndConsructionYear = (exportTypes: Export[]) =>
  getMockedFullStudy({
    emissionSources: [
      getMockedFullStudyEmissionSource({
        id: 'source-1',
        caracterisation: EmissionSourceCaracterisation.Operated,
        validated: true,
        constructionYear: new Date('2025'),
      }),
    ],
    exports: {
      types: exportTypes,
      control: ControlMode.Operational,
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

const clickExportCheckbox = async (user: ReturnType<typeof userEvent.setup>, exportType: Export) => {
  const checkbox = screen.getByTestId(`export-checkbox-${exportType}`)
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

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(screen.getByTestId('beges-activation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when checking BEGES with validated sources and active GHG-P export on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSourcesAndCaracterisations([Export.GHGP])
      const values = {
        exports: study.exports?.types as Export[],
        controlMode: study.exports?.control as ControlMode,
      }

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} values={values} />)

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.GHGP, Export.Beges])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when checking BEGES without validated sources', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} />)

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.Beges])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when checking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckboxes {...defaultProps} />)

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.Beges])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should show warning when checking BEGES on duplicate study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckboxes {...defaultProps} duplicateStudyId="duplicate-study-id" study={study} />)

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(screen.getByTestId('beges-activation-warning-modal')).toBeInTheDocument()
      })
    })
  })

  describe('GHGPActivationWarningModal', () => {
    it('should show warning when checking GHGP with validated sources on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSources()

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} />)

      await clickExportCheckbox(user, Export.GHGP)

      await waitFor(() => {
        expect(screen.getByTestId('ghgp-activation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should show warning when checking GHGP with validated sources and active Beges export on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSourcesAndCaracterisations([Export.Beges])
      const values = {
        exports: study.exports?.types as Export[],
        controlMode: study.exports?.control as ControlMode,
      }

      renderWithTheme(<ExportCheckboxes {...defaultProps} study={study} values={values} />)

      await clickExportCheckbox(user, Export.GHGP)

      await waitFor(() => {
        expect(screen.getByTestId('ghgp-activation-warning-modal')).toBeInTheDocument()
      })
    })
  })

  describe('BegesDeactivationWarningModal', () => {
    it('should show warning when unchecking BEGES with caracterisations on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations()

      renderWithTheme(
        <ExportCheckboxes {...defaultProps} study={study} values={getExportCheckedValues([Export.Beges])} />,
      )

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(screen.getByTestId('beges-deactivation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should not show warning when unchecking BEGES with validated sources and active GHG-P export on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSourcesAndCaracterisations([Export.GHGP, Export.Beges])

      renderWithTheme(
        <ExportCheckboxes
          {...defaultProps}
          study={study}
          values={getExportCheckedValues([Export.Beges, Export.GHGP])}
        />,
      )

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([Export.GHGP])
      })

      expect(screen.queryByTestId('beges-activation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when unchecking BEGES without caracterisations', async () => {
      const user = userEvent.setup()
      const study = getStudyWithoutCaracterisations()

      renderWithTheme(
        <ExportCheckboxes {...defaultProps} study={study} values={getExportCheckedValues([Export.Beges])} />,
      )

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([])
      })

      expect(screen.queryByTestId('beges-deactivation-warning-modal')).not.toBeInTheDocument()
    })

    it('should not show warning when unchecking BEGES on new study', async () => {
      const user = userEvent.setup()

      renderWithTheme(<ExportCheckboxes {...defaultProps} values={getExportCheckedValues([Export.Beges])} />)

      await clickExportCheckbox(user, Export.Beges)

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
          values={getExportCheckedValues([Export.Beges])}
          duplicateStudyId="duplicate-study-id"
        />,
      )

      await clickExportCheckbox(user, Export.Beges)

      await waitFor(() => {
        expect(screen.getByTestId('beges-deactivation-warning-modal')).toBeInTheDocument()
      })
    })
  })

  describe('GHGPDeactivationWarningModal', () => {
    it('should show warning when unchecking GHG-P with caracterisations on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithCaracterisations([Export.GHGP])

      renderWithTheme(
        <ExportCheckboxes {...defaultProps} study={study} values={getExportCheckedValues([Export.GHGP])} />,
      )

      await clickExportCheckbox(user, Export.GHGP)

      await waitFor(() => {
        expect(screen.getByTestId('ghgp-deactivation-warning-modal')).toBeInTheDocument()
      })
    })

    it('should show warning when unchecking GHG-P with validated sources and active Beges export on existing study', async () => {
      const user = userEvent.setup()
      const study = getStudyWithValidatedSourcesAndCaracterisationsAndConsructionYear([Export.GHGP, Export.Beges])

      renderWithTheme(
        <ExportCheckboxes
          {...defaultProps}
          study={study}
          values={getExportCheckedValues([Export.Beges, Export.GHGP])}
        />,
      )

      await clickExportCheckbox(user, Export.GHGP)

      await waitFor(() => {
        expect(screen.getByTestId('ghgp-deactivation-warning-modal')).toBeInTheDocument()
      })
    })
  })
})
