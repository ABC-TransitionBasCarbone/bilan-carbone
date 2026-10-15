import { getAccountById } from '@/db/account'
import { deleteEmissionFactorAndDependencies, getEmissionFactorById, updateEmissionFactor } from '@/db/emissionFactors'
import { getLocale } from '@/i18n/locale'
import { auth, dbActualizedAuth } from '@/services/auth'
import { canCreateEmissionFactor } from '@/services/permissions/emissionFactor.server'
import { getMockedAccount, getMockedDbActualizedAuth } from '@/tests/utils/models/user'
import { Import, Unit } from '@abc-transitionbascarbone/common/db/enums'
import { Locale } from '@abc-transitionbascarbone/common/i18n/config'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { deleteEmissionFactor, updateEmissionFactorCommand } from './emissionFactor'
import { UpdateEmissionFactorCommand } from './emissionFactor.command'

jest.mock('@/db/account', () => ({ getAccountById: jest.fn() }))
jest.mock('@/db/client.server', () => ({ prismaClient: {} }))
jest.mock('@/db/emissionFactors', () => ({
  getEmissionFactorById: jest.fn(),
  deleteEmissionFactorAndDependencies: jest.fn(),
  updateEmissionFactor: jest.fn(),
}))
jest.mock('@/db/organization', () => ({}))
jest.mock('@/i18n/locale', () => ({ getLocale: jest.fn() }))
jest.mock('@/services/auth', () => ({ auth: jest.fn(), dbActualizedAuth: jest.fn() }))
jest.mock('@/services/permissions/emissionFactor.server', () => ({ canCreateEmissionFactor: jest.fn() }))
jest.mock('@/services/permissions/study', () => ({}))
jest.mock('@/services/study.server', () => ({}))
jest.mock('@abc-transitionbascarbone/common/utils/serverResponse', () => ({
  logServerFunctionCall: jest.fn(),
}))

const command: UpdateEmissionFactorCommand = {
  id: 'factor-id',
  name: 'Manual factor',
  unit: Unit.KG,
  isMonetary: false,
  source: 'Manual source',
  totalCo2: 1,
  reliability: 1,
  technicalRepresentativeness: 1,
  geographicRepresentativeness: 1,
  temporalRepresentativeness: 1,
  completeness: 1,
  parts: [],
  subPosts: {},
  base: null,
}

const session = getMockedDbActualizedAuth()
const account = {
  ...getMockedAccount(),
  organizationVersion: { organizationId: session.user.organizationId },
}
const mockGetAccountById = getAccountById as jest.Mock
const mockGetEmissionFactorById = getEmissionFactorById as jest.Mock

describe.each([
  ['delete', () => deleteEmissionFactor(command.id)],
  ['update', () => updateEmissionFactorCommand(command)],
] as const)('%s emission factor permissions', (action, execute) => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(auth).mockResolvedValue(session)
    jest.mocked(dbActualizedAuth).mockResolvedValue(session)
    mockGetAccountById.mockResolvedValue(account)
    mockGetEmissionFactorById.mockResolvedValue({
      id: command.id,
      organizationId: session.user.organizationId,
      importedFrom: Import.Manual,
    })
    jest.mocked(getLocale).mockResolvedValue(Locale.FR)
    jest.mocked(canCreateEmissionFactor).mockResolvedValue(true)
  })

  it('allows an authorized account to mutate its own organization factor', async () => {
    await expect(execute()).resolves.toEqual({ success: true, data: undefined })
    expect(canCreateEmissionFactor).toHaveBeenCalledWith(account)
    if (action === 'delete') {
      expect(deleteEmissionFactorAndDependencies).toHaveBeenCalledWith(command.id)
    } else {
      expect(updateEmissionFactor).toHaveBeenCalledWith(session, Locale.FR, command)
    }
  })

  it('denies accounts without creation rights', async () => {
    jest.mocked(canCreateEmissionFactor).mockResolvedValue(false)

    await expect(execute()).resolves.toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(deleteEmissionFactorAndDependencies).not.toHaveBeenCalled()
    expect(updateEmissionFactor).not.toHaveBeenCalled()
  })

  it('denies a factor from another organization even with creation rights', async () => {
    mockGetEmissionFactorById.mockResolvedValue({
      id: command.id,
      organizationId: 'another-organization',
    })

    await expect(execute()).resolves.toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(deleteEmissionFactorAndDependencies).not.toHaveBeenCalled()
    expect(updateEmissionFactor).not.toHaveBeenCalled()
  })

  it('denies missing factors', async () => {
    jest.mocked(getEmissionFactorById).mockResolvedValue(null)

    await expect(execute()).resolves.toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(deleteEmissionFactorAndDependencies).not.toHaveBeenCalled()
    expect(updateEmissionFactor).not.toHaveBeenCalled()
  })

  it('denies unauthenticated requests', async () => {
    jest.mocked(auth).mockResolvedValue(null)
    jest.mocked(dbActualizedAuth).mockResolvedValue(null)

    await expect(execute()).resolves.toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(deleteEmissionFactorAndDependencies).not.toHaveBeenCalled()
    expect(updateEmissionFactor).not.toHaveBeenCalled()
  })
})
