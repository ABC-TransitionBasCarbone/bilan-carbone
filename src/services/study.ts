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

export const getEmissionSourceStatus = (emissionSource: FullStudy['emissionSources'][0]) => {
  if (emissionSource.validated) {
    return 'valid'
  }

  if (emissionSource.value !== null && emissionSource.emissionFactor !== null) {
    return 'toVerify'
  }

  return 'waiting'
}
