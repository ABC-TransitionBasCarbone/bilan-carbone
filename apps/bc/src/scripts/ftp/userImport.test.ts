import { addAccount, getAccountByEmailAndEnvironment } from '@/db/account'
import { createUsers, getUsersByEmails, updateAccount } from '@/db/user'
import { getDeactivableFeatureRestrictions } from '@/services/serverFunctions/deactivableFeatures'
import { Environment, Level, Role, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { processUsers } from './userImport'

jest.mock('@/db/account', () => ({
  addAccount: jest.fn(),
  getAccountByEmailAndEnvironment: jest.fn(),
}))

jest.mock('@/db/organization', () => ({
  createOrUpdateOrganization: jest.fn(),
  getOrganizationVersionByOrganizationIdAndEnvironment: jest.fn(),
  getRawOrganizationById: jest.fn(),
  getRawOrganizationBySiret: jest.fn(),
}))

jest.mock('@/db/user', () => ({
  createUsers: jest.fn(),
  getUsersByEmails: jest.fn(),
  organizationVersionActiveAccountsCount: jest.fn(),
  updateAccount: jest.fn(),
}))

jest.mock('@/services/serverFunctions/deactivableFeatures', () => ({
  getDeactivableFeatureRestrictions: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../prisma/seed/utils', () => ({
  getEnvRoleFromBase: jest.fn((role: Role) => role),
}))

describe('processUsers', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDeactivableFeatureRestrictions).mockResolvedValue(null)
    jest.mocked(createUsers).mockResolvedValue({ count: 0 })
    jest
      .mocked(getUsersByEmails)
      .mockImplementation(
        (emails) =>
          Promise.resolve(emails.map((email, index) => ({ id: `${index}`, email }))) as ReturnType<
            typeof getUsersByEmails
          >,
      )
    jest.mocked(addAccount).mockResolvedValue({} as Awaited<ReturnType<typeof addAccount>>)
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })

  it('creates users with sanitized email and computed level for new accounts', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsers).mockResolvedValue({ count: 1 })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers([{ userEmail: '  NEW.USER@Example.COM ', sessionCode: 'FORM-BCM2' }], importedFileDate)

    expect(createUsers).toHaveBeenCalledTimes(1)
    expect(createUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        email: 'new.user@example.com',
        level: Level.Advanced,
      }),
    ])
    expect(addAccount).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts created')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })

  it('filters new users from environments where creation is deactivated', async () => {
    jest.mocked(getDeactivableFeatureRestrictions).mockResolvedValue({
      active: true,
      deactivatedSources: [],
      deactivatedEnvironments: [Environment.BC],
    })
    await processUsers([{ userEmail: 'blocked@example.com', sessionCode: 'FORM-BCM2' }], new Date())

    expect(createUsers).not.toHaveBeenCalled()
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
      },
    } as Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>)

    await processUsers([{ userEmail: 'existing@example.com' }], new Date('2026-01-15T12:00:00.000Z'))

    expect(updateAccount).toHaveBeenCalledTimes(1)
    expect(createUsers).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('No new users to create')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts updated')
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Progress:'))
  })

  it('processes multiple new users with trainings and computes the correct level for each', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsers).mockResolvedValue({ count: 2 })

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

    expect(createUsers).toHaveBeenCalledTimes(1)
    expect(createUsers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'advanced.before2026@yopmail.com',
          firstName: 'Advanced',
          lastName: 'Before2026',
          level: Level.Advanced,
        }),
        expect.objectContaining({
          email: 'initial.user@yopmail.com',
          firstName: 'Initial',
          lastName: 'User',
          level: Level.Initial,
        }),
      ]),
    )

    expect(consoleLogSpy).toHaveBeenCalledWith('2 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('2 accounts created')
  })

  it('handles old PascalCase FTP format (without trainings) and maps fields correctly', async () => {
    jest.mocked(getAccountByEmailAndEnvironment).mockResolvedValue(null)
    jest.mocked(createUsers).mockResolvedValue({ count: 1 })

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

    expect(createUsers).toHaveBeenCalledTimes(1)
    expect(createUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        email: 'test@yopmail.com',
        level: Level.Advanced,
      }),
    ])
    expect(addAccount).toHaveBeenCalledTimes(1)
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
    jest.mocked(createUsers).mockResolvedValue({ count: 1 })

    const importedFileDate = new Date('2026-01-15T12:00:00.000Z')
    await processUsers([{ userEmail: 'new@example.com' }, { userEmail: 'existing@example.com' }], importedFileDate)

    expect(createUsers).toHaveBeenCalledTimes(1)
    expect(createUsers).toHaveBeenCalledWith([expect.objectContaining({ email: 'new@example.com' })])

    expect(updateAccount).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('1 users created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts created')
    expect(consoleLogSpy).toHaveBeenCalledWith('1 accounts updated')
  })
})
