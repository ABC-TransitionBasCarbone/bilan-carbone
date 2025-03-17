import { SiteCAUnit, StudyResultUnit } from '@prisma/client'
import Big from 'big.js'

export const formatNumber = (value: number, dec = 2) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

export const displayCA = (ca: number, factor: number) => new Big(ca).div(factor).toNumber()

export const CA_UNIT_VALUES: Record<SiteCAUnit, number> = {
  U: 1,
  K: 1000,
  M: 1000000,
}

export const defaultCAUnit = CA_UNIT_VALUES[SiteCAUnit.K]

export const STUDY_UNIT_VALUES: Record<StudyResultUnit, number> = {
  K: 1,
  T: 1000,
}

export const defaultStudyResultUnit = StudyResultUnit.T
