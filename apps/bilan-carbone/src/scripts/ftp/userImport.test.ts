import { getAccountByEmailAndEnvironment } from '@/db/account'
import { createUsersWithAccount, updateAccount } from '@/db/user'
import { Environment, Level, Role, UserStatus } from '@repo/db-common/enums'
import { processUsers } from './userImport'

jest.mock('@/db/account', () => ({
  getAccountByEmailAndEnvironment: jest.fn(),
}))

jest.mock('@/db/organization', () => ({
  createOrUpdateOrganization: jest.fn(),
  getOrganizationVersionByOrganizationIdAndEnvironment: jest.fn(),
  getRawOrganizationById: jest.fn(),
  getRawOrganizationBySiret: jest.fn(),
}))

jest.mock('@/db/user', () => ({
  createUsersWithAccount: jest.fn(),
  organizationVersionActiveAccountsCount: jest.fn(),
  updateAccount: jest.fn(),
}))

jest.mock('../../../prisma/seed/utils', () => ({
  getCutRoleFromBase: jest.fn((role: Role) => role),
}))

describe('processUsers', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })

  it('creates users with sanitized email and computed level for new accounts', async () => {
    ;(getAccountByEmailAndEnvironment as jest.Mock).mockResolvedValue(null)
    ;(createUsersWithAccount as jest.Mock).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers([{ userEmail: '  NEW.USER@Example.COM ', sessionCode: 'FORM-BCM2' }], importedFileDate)

    expect(createUsersWithAccount).toHaveBeenCalledTimes(1)
    const [usersToCreate] = (createUsersWithAccount as jest.Mock).mock.calls[0]
    expect(usersToCreate).toHaveLength(1)
    expect(usersToCreate[0]).toMatchObject({
      email: 'new.user@example.com',
      level: Level.Advanced,
      account: {
        role: Role.COLLABORATOR,
        status: UserStatus.IMPORTED,
        environment: Environment.BC,
        importedFileDate,
      },
    })
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts created')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })

  it('updates imported existing accounts and skips bulk create when no new users', async () => {
    ;(getAccountByEmailAndEnvironment as jest.Mock).mockResolvedValue({
      id: 'account-id',
      status: UserStatus.IMPORTED,
      user: {
        id: 'user-id',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
      },
    })

    await processUsers([{ userEmail: 'existing@example.com' }], new Date('2026-01-15T12:00:00.000Z'))

    expect(updateAccount).toHaveBeenCalledTimes(1)
    expect(createUsersWithAccount).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('No new users to create')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts updated')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })
})
