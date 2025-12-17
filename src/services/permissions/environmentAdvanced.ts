import { Environment, Level } from '@prisma/client'

const { BC, CUT, TILT, CLICKSON } = Environment

export const hasAccessToEmissionFactors = (environment: Environment, userLevel: Level | null) => {
  return ([BC, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)
}

export const hasAccessToStudies = (environment: Environment, userLevel: Level | null) =>
  ([BC, CUT, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)
