import { expect } from '@jest/globals'
import { Environment, Import } from '@prisma/client'
import { isSourceForEnv } from './import'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))

jest.mock('../permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

describe('import Service', () => {
  describe('isSourceForEnv', () => {
    it('should retrieve sources for env', () => {
      process.env.BC_FE_SOURCES_IMPORT = 'BaseEmpreinte,Legifrance,NegaOctet,Manual,ADEME,CUT'
      const result = isSourceForEnv(Environment.BC)
      expect(result).toEqual([Import.BaseEmpreinte, Import.Legifrance, Import.NegaOctet, Import.Manual, Import.CUT])
    })

    it('should not retrieve sources when env has no import', () => {
      process.env.BC_FE_SOURCES_IMPORT = ''
      const result = isSourceForEnv(Environment.BC)
      expect(result).toEqual([])
    })
  })
})
