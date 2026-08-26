import { Environment } from '@abc-transitionbascarbone/db-common/enums'

const { BC, CUT, TILT, CLICKSON, MIP } = Environment
const advancedEnvironments: Environment[] = [BC, TILT]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

export const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
export const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)

export const environmentWithOnboarding: Environment[] = [BC, CLICKSON]
export const environmentsWithChecklist: Environment[] = [BC]
export const EnvironmentNames = {
  [BC]: 'BC+ 2.0',
  [CUT]: 'Count',
  [TILT]: 'Tilt',
  [CLICKSON]: 'ClicksOn',
  [MIP]: 'Mon Impact Pro',
}

export enum EnvironmentMode {
  SIMPLIFIED = 'SIMPLIFIED',
  ADVANCED = 'ADVANCED',
}
