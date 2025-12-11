import { Environment, Level } from '@prisma/client'

export const hasAccessToAdvancedRessources = (environment: Environment, userLevel: Level | null) =>
  environment !== Environment.TILT || !!userLevel
