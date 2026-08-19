import { Unit } from '@abc-transitionbascarbone/db-common/enums'
import { BCUnit, CUTUnit, OldUnit } from './unit'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('Unit service', () => {
  describe('all units are present in one env', () => {
    const allUnits = { ...BCUnit, ...CUTUnit, ...OldUnit }
    const allUnitValues = Object.values(allUnits)

    for (const unit of Object.values(Unit)) {
      it(`should have unit ${unit} in BCUnit or CUTUnit`, () => {
        expect(allUnitValues).toContain(unit)
      })
    }
  })
})
