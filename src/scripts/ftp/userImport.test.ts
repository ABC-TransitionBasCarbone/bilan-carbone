import { expect } from '@jest/globals'
import * as userImportModule from './userImport'
import * as dbUser from '@/db/user'



// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('@/services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/auth', () => ({ auth: jest.fn() }))
jest.mock('@/services/permissions/study', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('@/services/study', () => ({ checkLevel: jest.fn() }))
jest.mock('@/services/serverFunctions/emissionFactor', () => ({ getEmissionFactorsByIds: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))


jest.mock('@/db/user.ts', () => ({ createUsersWithAccount: jest.fn() }))
const mockCreateUsersWithAccount = dbUser.createUsersWithAccount as jest.Mock

describe('processUsers', () => {
    let mockProcessUser: jest.Mock
    beforeAll(() => {
        jest.clearAllMocks()
        jest.mock('./userImport', () => ({ processUser: jest.fn() }))
        mockProcessUser = userImportModule.processUser as jest.Mock
    })

    it('if no user in input, no user is created and no account created', () => {
        const values: Record<string, string>[] = []

        mockCreateUsersWithAccount.mockResolvedValue({ newUsers: { count: 0 }, newAccounts: { count: 0 } })

        userImportModule.processUsers(values, new Date())

        expect(mockProcessUser).toHaveBeenCalledTimes(0)
        expect(mockCreateUsersWithAccount).toHaveBeenCalledWith([])
    })

    // it('if user in input, user is created and account created', () => {
    //     const values: Record<string, string>[] = [{ Firstname: 'John', Lastname: 'Doe', Email: 'john.doe@example.com' }, { Firstname: 'John', Lastname: 'Doe', Email: 'john.doe@example.com' }, { Firstname: 'ABC', Lastname: 'Transition', Email: 'abc.transition@example.com' }]

    //     userImportModule.processUsers(values, new Date())

    //     expect(mockProcessUser).toHaveBeenCalledTimes(values.length)
    //     // expect(mockCreateUsersWithAccount).toHaveBeenCalledWith([])


    // })
})
