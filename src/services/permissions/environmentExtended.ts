import { Environment, Level } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { BC, CUT, TILT, CLICKSON } = Environment

export const hasAccessToStudies = (environment: Environment, userLevel: Level | null) =>
  environment !== TILT || userLevel
