import { expect } from '@jest/globals'
import { Environment, SubPost } from '@prisma/client'
import { getTransEnvironmentSubPost } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('./file', () => ({ download: jest.fn() }))
jest.mock('./auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))

describe('Study Service', () => {
  describe('getTransEnvironmentSubPost', () => {
    it('Should return same subPost for iso-environments', () => {
      Object.values(SubPost).forEach((subPost) => {
        expect(getTransEnvironmentSubPost(Environment.BC, Environment.BC, subPost)).toBe(subPost)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.CUT, subPost)).toBe(subPost)
        expect(getTransEnvironmentSubPost(Environment.TILT, Environment.TILT, subPost)).toBe(subPost)
      })
    })

    it('Should return undefined for CUT environment', () => {
      Object.values(SubPost).forEach((subPost) => {
        expect(getTransEnvironmentSubPost(Environment.BC, Environment.CUT, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.BC, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.TILT, Environment.CUT, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.TILT, subPost)).toBe(undefined)
      })
    })

    it('BC to Tilt environment', () => {
      const source = Environment.BC
      const target = Environment.TILT
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsDomicileTravail)).toBe(
        SubPost.DeplacementsDomicileTravailSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsProfessionnels)).toBe(
        SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.Electricite)).toBe(SubPost.Electricite)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Equipements)).toBe(SubPost.EquipementsDesSalaries)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Informatique)).toBe(SubPost.ParcInformatiqueDesSalaries)
      expect(getTransEnvironmentSubPost(source, target, SubPost.NourritureRepasBoissons)).toBe(
        SubPost.RepasPrisParLesSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.UtilisationEnDependance)).toBe(
        SubPost.UtilisationEnDependanceConsommationDeBiens,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.UtilisationEnResponsabilite)).toBe(
        SubPost.UtilisationEnDependanceConsommationDeBiens,
      )
    })

    it('Tilt to BC environment', () => {
      const source = Environment.TILT
      const target = Environment.BC
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsDomicileTravailSalaries)).toBe(
        SubPost.DeplacementsDomicileTravail,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.TeletravailSalaries)).toBe(SubPost.Electricite)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Electricite)).toBe(SubPost.Electricite)
    })
  })
})
