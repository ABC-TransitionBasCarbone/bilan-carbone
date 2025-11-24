import { Environment } from '@prisma/client'

export const environmentWithOnboarding: Environment[] = [Environment.BC]
export const environmentsWithChecklist: Environment[] = [Environment.BC]
export const EnvironmentNames = {
  [Environment.BC]: 'BC+ 2.0',
  [Environment.CUT]: 'Count',
  [Environment.TILT]: 'Tilt',
  [Environment.CLICKSON]: 'ClicksOn',
}
