import { getMockedDbUser } from '@/tests/utils/models'
import { expect } from '@jest/globals'
import { Level } from '@prisma/client'
import { hasAccessToFormation } from './formations'

describe('Formation permissions service', () => {
  describe('hasAccessToFormation', () => {
    it('"Advanced" level user should be able to access the formation view', async () => {
      const user = getMockedDbUser({ level: Level.Advanced })
      const result = await hasAccessToFormation(user)
      expect(result).toBe(true)
    })

    it('"Standard" level user should be able to access the formation view', async () => {
      const user = getMockedDbUser({ level: Level.Standard })
      const result = await hasAccessToFormation(user)
      expect(result).toBe(true)
    })

    it('"Initial" level user should be able to access the formation view', async () => {
      const user = getMockedDbUser({ level: Level.Initial })
      const result = await hasAccessToFormation(user)
      expect(result).toBe(true)
    })

    it('Untrained user should not be able to access the formation view', async () => {
      const user = getMockedDbUser({ level: null })
      const result = await hasAccessToFormation(user)
      expect(result).toBe(false)
    })
  })
})
