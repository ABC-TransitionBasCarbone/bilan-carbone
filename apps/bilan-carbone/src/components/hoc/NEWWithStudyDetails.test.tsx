import { getMinimalStudyForRights } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { getMockedMinimalStudy } from '@/tests/utils/models/study'
import NEWWithStudyDetails from './NEWWithStudyDetails'

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

jest.mock('@/db/study', () => ({
  getMinimalStudyForRights: jest.fn(),
}))

jest.mock('@/services/permissions/study', () => ({
  canReadStudy: jest.fn(),
  canReadStudyDetail: jest.fn(),
}))

const NotFoundComponent = () => {
  return <div>not-found</div>
}

jest.mock('@abc-transitionbascarbone/components/src/pages/NotFound', () => ({
  __esModule: true,
  default: NotFoundComponent,
}))

const mockedGetMinimalStudyForRights = jest.mocked(getMinimalStudyForRights)
const mockedCanReadStudy = jest.mocked(canReadStudy)
const mockedCanReadStudyDetail = jest.mocked(canReadStudyDetail)

const mockUser = {
  email: 'user@example.com',
  id: 'user-1',
  organizationVersionId: 'org-1',
}

const mockedMinimalStudy = getMockedMinimalStudy()

describe('NEWWithStudyDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the NotFound element when id is missing', async () => {
    const WrappedComponent = jest.fn(() => <div>wrapped</div>)
    const Component = NEWWithStudyDetails(WrappedComponent)

    const result = await Component({ params: Promise.resolve({ id: '' }), user: mockUser })

    expect(result.type).toBe(NotFoundComponent)
    expect(result.props).toEqual({})
  })

  it('returns the NotFound element when the study does not exist', async () => {
    mockedGetMinimalStudyForRights.mockResolvedValue(null)
    const WrappedComponent = jest.fn(() => <div>wrapped</div>)
    const Component = NEWWithStudyDetails(WrappedComponent)

    const result = await Component({ params: Promise.resolve({ id: 'study-1' }), user: mockUser })

    expect(result.type).toBe(NotFoundComponent)
    expect(result.props).toEqual({})
  })

  it('redirects to contributor page when the user can read the study but not the detailed rights', async () => {
    mockedGetMinimalStudyForRights.mockResolvedValue(mockedMinimalStudy)
    mockedCanReadStudyDetail.mockResolvedValue(false)
    mockedCanReadStudy.mockResolvedValue(true)

    const WrappedComponent = jest.fn(() => <div>wrapped</div>)
    const Component = NEWWithStudyDetails(WrappedComponent)

    await expect(Component({ params: Promise.resolve({ id: 'study-1' }), user: mockUser })).rejects.toThrow(
      'REDIRECT:/etudes/study-1/contributeur',
    )
  })

  it('injects the minimal study into the wrapped component when the user has detail access', async () => {
    mockedGetMinimalStudyForRights.mockResolvedValue(mockedMinimalStudy)
    mockedCanReadStudyDetail.mockResolvedValue(true)

    const WrappedComponent = jest.fn(() => <div>wrapped</div>)
    const Component = NEWWithStudyDetails(WrappedComponent)

    const result = await Component({
      params: Promise.resolve({ id: 'study-1' }),
      user: mockUser,
      extra: 'value',
    })

    expect(result.type).toBe(WrappedComponent)
    expect(result.props).toMatchObject({
      user: mockUser,
      extra: 'value',
      minimalStudy: mockedMinimalStudy,
    })
  })
})
