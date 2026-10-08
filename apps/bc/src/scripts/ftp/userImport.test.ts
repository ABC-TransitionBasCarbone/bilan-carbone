import { getAccountByEmailAndEnvironment } from '@/db/account'
import {
  createOrUpdateOrganization,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationBySiret,
} from '@/db/organization'
import { createUsersWithAccount, organizationVersionActiveAccountsCount, updateAccount } from '@/db/user'
import { Environment, Level, Role, UserSource, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
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
  getEnvRoleFromBase: jest.fn((role: Role) => role),
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
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers([{ userEmail: '  NEW.USER@Example.COM ', sessionCode: 'FORM-BCM2' }], importedFileDate)

    expect(createUsersWithAccount).toHaveBeenCalledTimes(1)
    expect(createUsersWithAccount).toHaveBeenCalledWith([
      expect.objectContaining({
        email: 'new.user@example.com',
        level: Level.Advanced,
        account: expect.objectContaining({
          role: Role.DEFAULT,
          status: UserStatus.IMPORTED,
          environment: Environment.BC,
          importedFileDate,
        }),
      }),
    ])
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts created')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })

  it('updates imported existing accounts and skips bulk create when no new users', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue({
      id: 'account-id',
      status: UserStatus.IMPORTED,
      user: {
        id: 'user-id',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        level: Level.Advanced,
      },
    } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)

    await processUsers([{ userEmail: 'existing@example.com' }], new Date('2026-01-15T12:00:00.000Z'))

    expect(updateAccount).toHaveBeenCalledTimes(1)
    expect(jest.mocked(updateAccount).mock.calls[0][1]).toEqual(expect.objectContaining({ role: Role.DEFAULT }))
    expect(createUsersWithAccount).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('No new users to create')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts updated')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })

  it.each([Environment.BC, Environment.TILT])(
    'updates imported data for invited %s accounts without changing their access',
    async (environment) => {
      jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue({
        id: 'account-id',
        status: UserStatus.VALIDATED,
        role: Role.DEFAULT,
        organizationVersionId: 'organization-version-id',
        user: {
          id: 'user-id',
          email: 'invited@example.com',
          firstName: 'Old',
          lastName: 'Name',
          source: UserSource.CRON,
        },
      } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)

      await processUsers(
        [
          {
            userEmail: 'invited@example.com',
            firstName: 'Updated',
            lastName: 'User',
            companyName: 'Example Company',
            siret: '12345678901234',
            environment,
            source: UserSource.TUNISIE,
            formationName: 'Bilan Carbone® Maitrise',
            formationStartDate: '2026-01-15',
            formationEndDate: '2026-01-16',
          },
        ],
        new Date('2026-01-15T12:00:00.000Z'),
      )

      const [, accountData, userData] = jest.mocked(updateAccount).mock.calls[0]
      expect(accountData).toEqual(
        expect.objectContaining({
          environment,
          formationName: 'Bilan Carbone® Maitrise',
          formationStartDate: '2026-01-15',
          formationEndDate: '2026-01-16',
        }),
      )
      expect(accountData).not.toHaveProperty('role')
      expect(accountData).not.toHaveProperty('status')
      expect(accountData).not.toHaveProperty('organizationVersion')
      expect(userData).toEqual(
        expect.objectContaining({
          firstName: 'Updated',
          lastName: 'User',
          source: UserSource.TUNISIE,
        }),
      )
      expect(createOrUpdateOrganization).not.toHaveBeenCalled()
      expect(createUsersWithAccount).not.toHaveBeenCalled()
    },
  )

  it('rejects FTP records from unsupported environments', async () => {
    await expect(
      processUsers([{ userEmail: 'unsupported@example.com', environment: Environment.CUT }], new Date()),
    ).rejects.toThrow(`Unsupported FTP environment: ${Environment.CUT}`)

    expect(getAccountByEmailAndEnvironment).not.toHaveBeenCalled()
  })

  it.each([undefined, Level.Advanced])(
    'keeps imported BC accounts at the default role until activation',
    async (level) => {
      jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue({
        id: 'account-id',
        status: UserStatus.IMPORTED,
        role: Role.COLLABORATOR,
        organizationVersion: { id: 'organization-version-id' },
        user: {
          id: 'user-id',
          email: 'imported@example.com',
          firstName: 'Imported',
          lastName: 'User',
          ...(level !== undefined && { level }),
        },
      } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)
      await processUsers([{ userEmail: 'imported@example.com', sessionCode: level ? 'BCM2' : undefined }], new Date())

      expect(jest.mocked(updateAccount).mock.calls[0][1]).toEqual(expect.objectContaining({ role: Role.DEFAULT }))
    },
  )

  it.each([
    [undefined, Role.GESTIONNAIRE],
    ['BCM2', Role.ADMIN],
  ])('links an active BC account to an empty target organization with role %s', async (sessionCode, role) => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue({
      id: 'account-id',
      status: UserStatus.ACTIVE,
      role: Role.COLLABORATOR,
      organizationVersion: { id: 'old-version-id', organizationId: 'old-organization-id' },
      user: {
        id: 'user-id',
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
      },
    } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)
    jest.mocked(getRawOrganizationBySiret).mockResolvedValue({ id: 'target-organization-id' } as never)
    jest
      .mocked(getOrganizationVersionByOrganizationIdAndEnvironment)
      .mockResolvedValue({ id: 'target-version-id' } as never)
    jest.mocked(organizationVersionActiveAccountsCount).mockResolvedValue(0)
    jest.mocked(createOrUpdateOrganization).mockResolvedValue({ id: 'target-organization-id' } as never)

    await processUsers(
      [{ userEmail: 'active@example.com', siret: '12345678901234', environment: Environment.BC, sessionCode }],
      new Date(),
    )

    const [, accountData] = jest.mocked(updateAccount).mock.calls[0]
    expect(accountData).toEqual(
      expect.objectContaining({
        role,
        organizationVersion: { connect: { id: 'target-version-id' } },
      }),
    )
    expect(jest.mocked(createOrUpdateOrganization).mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: 'target-organization-id' }),
    )
  })

  it('does not move an active BC account into an organization with active members', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue({
      id: 'account-id',
      status: UserStatus.ACTIVE,
      role: Role.COLLABORATOR,
      organizationVersion: { id: 'old-version-id', organizationId: 'old-organization-id' },
      user: {
        id: 'user-id',
        email: 'active@example.com',
        firstName: 'Active',
        lastName: 'User',
      },
    } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)
    jest.mocked(getRawOrganizationBySiret).mockResolvedValue({ id: 'target-organization-id' } as never)
    jest
      .mocked(getOrganizationVersionByOrganizationIdAndEnvironment)
      .mockResolvedValue({ id: 'target-version-id' } as never)
    jest.mocked(organizationVersionActiveAccountsCount).mockResolvedValue(1)

    await processUsers(
      [{ userEmail: 'active@example.com', siret: '12345678901234', environment: Environment.BC, sessionCode: 'BCM2' }],
      new Date(),
    )

    const [, accountData, userData] = jest.mocked(updateAccount).mock.calls[0]
    expect(accountData).not.toHaveProperty('role')
    expect(accountData).not.toHaveProperty('organizationVersion')
    expect(userData).toEqual(expect.objectContaining({ level: Level.Advanced }))
    expect(createOrUpdateOrganization).not.toHaveBeenCalled()
  })

  it.each([
    ['a missing organization', null],
    ['an organization without active accounts', { id: 'target-organization-id' }],
  ])('creates or links a new BC account to %s without assigning an elevated role', async (_, organization) => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(getRawOrganizationBySiret).mockResolvedValue(organization as never)
    jest
      .mocked(getOrganizationVersionByOrganizationIdAndEnvironment)
      .mockResolvedValue({ id: 'target-version-id' } as never)
    jest.mocked(organizationVersionActiveAccountsCount).mockResolvedValue(0)
    jest.mocked(createOrUpdateOrganization).mockResolvedValue({ id: 'target-organization-id' } as never)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    await processUsers(
      [{ userEmail: 'new@example.com', siret: '12345678901234', environment: Environment.BC, sessionCode: 'BCM2' }],
      new Date(),
    )

    const importedUser = jest.mocked(createUsersWithAccount).mock.calls[0][0][0]
    expect(importedUser.account).toEqual(
      expect.objectContaining({
        role: Role.DEFAULT,
        organizationVersion: { connect: { id: 'target-version-id' } },
      }),
    )
  })

  it('does not link a new BC account to an organization that already has active members', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(getRawOrganizationBySiret).mockResolvedValue({ id: 'target-organization-id' } as never)
    jest
      .mocked(getOrganizationVersionByOrganizationIdAndEnvironment)
      .mockResolvedValue({ id: 'target-version-id' } as never)
    jest.mocked(organizationVersionActiveAccountsCount).mockResolvedValue(1)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    await processUsers(
      [{ userEmail: 'new@example.com', siret: '12345678901234', environment: Environment.BC }],
      new Date(),
    )

    const importedUser = jest.mocked(createUsersWithAccount).mock.calls[0][0][0]
    expect(importedUser.account.role).toBe(Role.DEFAULT)
    expect(importedUser.account).not.toHaveProperty('organizationVersion')
    expect(createOrUpdateOrganization).not.toHaveBeenCalled()
  })

  it('processes multiple new users with trainings and computes the correct level for each', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 2 },
      newAccounts: { count: 2 },
    })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    const users = [
      {
        userEmail: 'advanced.before2026@yopmail.com',
        firstName: 'Advanced',
        lastName: 'Before2026',
        purchasedProducts: 'licence_exploitation',
        companyName: 'Advanced Before2026 Company',
        siret: '53817009300603',
        country: 'FR',
        membershipYear: 'a:2:{i:0;s:4:"2024";i:1;s:4:"2025";}',
        trainings: [
          {
            trainingTypeId: 3,
            trainingOrganisation: 'IFC',
            trainingName: 'Bilan Carbone® Maitrise',
            sessionStartDate: '2026-09-15',
            sessionEndDate: '2026-09-17',
            expirationDate: '2050-09-15',
          },
        ],
      },
      {
        userEmail: 'initial.user@yopmail.com',
        firstName: 'Initial',
        lastName: 'User',
        trainings: [
          {
            trainingTypeId: 1,
            trainingOrganisation: 'IFC',
            trainingName: 'Bilan Carbone® Découverte',
            sessionStartDate: '2026-06-01',
            sessionEndDate: '2026-06-02',
            expirationDate: '2050-06-01',
          },
        ],
      },
    ]

    await processUsers(users, importedFileDate)

    expect(createUsersWithAccount).toHaveBeenCalledTimes(1)
    expect(createUsersWithAccount).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'advanced.before2026@yopmail.com',
          firstName: 'Advanced',
          lastName: 'Before2026',
          level: Level.Advanced,
          account: expect.objectContaining({
            role: Role.DEFAULT,
            status: UserStatus.IMPORTED,
            environment: Environment.BC,
            importedFileDate,
            formationName: 'Bilan Carbone® Maitrise',
          }),
        }),
        expect.objectContaining({
          email: 'initial.user@yopmail.com',
          firstName: 'Initial',
          lastName: 'User',
          level: Level.Initial,
          account: expect.objectContaining({
            role: Role.DEFAULT,
            status: UserStatus.IMPORTED,
            environment: Environment.BC,
            importedFileDate,
            formationName: 'Bilan Carbone® Découverte',
          }),
        }),
      ]),
    )

    expect(consoleLogSpy).toHaveBeenCalledWith('2 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('2 accounts created')
  })

  it('handles old PascalCase FTP format (without trainings) and maps fields correctly', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers(
      [
        {
          User_Login: '',
          User_Email: 'test@yopmail.com',
          Order_Date: '',
          Purchased_Products: 'adhesion_conseil',
          Session_Code: 'BCM3',
          Session_Date: '',
          Company_Name: '',
          SIRET: '53817009300032',
          Country: '',
          Membership_Year: '2026;',
          Organization_Category: '',
          Organization_Manager: '',
        },
      ],
      importedFileDate,
    )

    expect(createUsersWithAccount).toHaveBeenCalledTimes(1)
    expect(createUsersWithAccount).toHaveBeenCalledWith([
      expect.objectContaining({
        email: 'test@yopmail.com',
        level: Level.Advanced,
        account: expect.objectContaining({
          role: Role.DEFAULT,
          status: UserStatus.IMPORTED,
          environment: Environment.BC,
          importedFileDate,
        }),
      }),
    ])
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
  })

  it('processes a mix of new and existing users in a single batch', async () => {
    jest
      .mocked(getAccountByEmailAndEnvironment)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'account-existing',
        status: UserStatus.IMPORTED,
        user: { id: 'user-existing', email: 'existing@example.com', firstName: 'Existing', lastName: 'User' },
      } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)
    jest.mocked(createUsersWithAccount).mockResolvedValue({
      newUsers: { count: 1 },
      newAccounts: { count: 1 },
    })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers([{ userEmail: 'new@example.com' }, { userEmail: 'existing@example.com' }], importedFileDate)

    expect(createUsersWithAccount).toHaveBeenCalledTimes(1)
    expect(createUsersWithAccount).toHaveBeenCalledWith([expect.objectContaining({ email: 'new@example.com' })])

    expect(updateAccount).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts updated')
  })
})
