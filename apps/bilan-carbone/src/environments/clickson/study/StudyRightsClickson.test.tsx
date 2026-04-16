import theme from '@/environments/base/theme/theme'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { ReactNode } from 'react'
import StudyRightsClickson from './StudyRightsClickson'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('@/hooks/useServerFunction', () => ({
  useServerFunction: () => ({
    callServerFunction: jest.fn(async (fn, options) => {
      await fn()
      options?.onSuccess?.()
    }),
  }),
}))

jest.mock('@/components/base/Block', () => ({
  __esModule: true,
  default: ({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {icon}
      {children}
    </div>
  ),
}))

jest.mock('@/components/modals/Modal', () => ({
  __esModule: true,
  default: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/study/site/useStudySite', () => ({
  __esModule: true,
  default: () => ({
    siteId: 'site-id',
    studySiteId: 'study-site-id',
    setSite: jest.fn(),
  }),
}))

jest.mock('@/services/serverFunctions/study', () => ({
  getStudySite: jest.fn(async () => ({ success: true, data: null })),
  changeStudyEstablishment: jest.fn(),
  changeStudyDates: jest.fn(),
  changeStudyName: jest.fn(),
}))

jest.mock('@/components/form/TextField', () => ({
  FormTextField: () => <input />,
}))

jest.mock('@/components/form/DatePicker', () => ({
  FormDatePicker: () => <input />,
}))

jest.mock('@/components/form/Autocomplete', () => ({
  FormAutocomplete: () => <input />,
}))

jest.mock('@/components/study/rights/StudyContributorsTable', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/study/rights/StudyVersions', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/study/site/SelectStudySite', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/study/StudyComments', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/base/LinkButton', () => ({
  __esModule: true,
  default: () => null,
}))

describe('StudyRightsClickson', () => {
  const renderComponent = (editionDisabled: boolean) =>
    render(
      <ThemeProvider theme={theme}>
        <StudyRightsClickson
          study={getMockedFullStudy({ name: 'Session test' })}
          editionDisabled={editionDisabled}
          emissionFactorSources={[]}
          user={{} as never}
        />
      </ThemeProvider>,
    )

  it('shows edit study name action for admin/editor roles', () => {
    renderComponent(false)

    expect(screen.getByRole('heading', { name: 'Session test' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'edit' })).toBeInTheDocument()
  })

  it('hides edit study name action for contributors without edition rights', () => {
    renderComponent(true)

    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeInTheDocument()
  })
})
