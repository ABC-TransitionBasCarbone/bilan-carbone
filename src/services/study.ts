import { FullStudy } from '@/db/study'
import { Level } from '@prisma/client'

export const getAllowedLevels = (level: Level) => {
  switch (level) {
    case Level.Advanced:
      return [Level.Initial]
    case Level.Standard:
      return [Level.Initial, Level.Standard]
    case Level.Initial:
      return [Level.Initial, Level.Standard, Level.Advanced]
  }
}

export enum EmissionSourcesStatus {
  Valid = 'valid',
  ToVerify = 'toVerify',
  Waiting = 'waiting',
}

export const getEmissionSourceStatus = (emissionSource: FullStudy['emissionSources'][0]) => {
  if (emissionSource.validated) {
    return EmissionSourcesStatus.Valid
  }

  if (emissionSource.value !== null && emissionSource.emissionFactor !== null) {
    return EmissionSourcesStatus.ToVerify
  }

  return EmissionSourcesStatus.Waiting
}
