import { Environment } from '@repo/db-common/enums'

export const environmentWithOnboarding: Environment[] = [Environment.BC, Environment.CLICKSON]
export const environmentsWithChecklist: Environment[] = [Environment.BC]
export const EnvironmentNames = {
  [Environment.BC]: 'BC+ 2.0',
  [Environment.CUT]: 'Count',
  [Environment.TILT]: 'Tilt',
  [Environment.CLICKSON]: 'ClicksOn',
}

export enum EnvironmentMode {
  SIMPLIFIED = 'SIMPLIFIED',
  ADVANCED = 'ADVANCED',
}
