import { Environment } from '@abc-transitionbascarbone/db-common/enums'

const { BC, CUT, TILT, CLICKSON, MIP, FORMATION_BC } = Environment
export const formationEnvironments = [Environment.FORMATION_BC] as Environment[]
export const advancedEnvironments: Environment[] = [BC, TILT, ...formationEnvironments]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

export const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
export const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)
export const isFormation = (environment: Environment) => formationEnvironments.includes(environment)


export const environmentWithOnboarding: Environment[] = [BC, CLICKSON]
export const environmentsWithChecklist: Environment[] = [BC]
export const EnvironmentNames = {
  [BC]: 'BC+ 2.0',
  [CUT]: 'Count',
  [TILT]: 'Tilt',
  [CLICKSON]: 'ClicksOn',
  [MIP]: 'Mon Impact Pro',
  [FORMATION_BC]: 'BC+ Formation',
}

export enum EnvironmentMode {
  SIMPLIFIED = 'SIMPLIFIED',
  ADVANCED = 'ADVANCED',
}

const COUNT_ROUTE = '/count'
const TILT_ROUTE = '/tilt'
const CLICKSON_ROUTE = '/clickson'
const FORMATION_BC_ROUTE = '/formation-bc'
export const getEnvRoute = (path: string, env?: Environment) => {
  let base = ''
  switch (env) {
    case Environment.CUT:
      base = COUNT_ROUTE
      break
    case Environment.TILT:
      base = TILT_ROUTE
      break
    case Environment.CLICKSON:
      base = CLICKSON_ROUTE
      break
    case Environment.FORMATION_BC:
      base = FORMATION_BC_ROUTE
      break
    default:
      break
  }

  return `${base}/${path}`
}

export const ENV_ROUTES = [COUNT_ROUTE, TILT_ROUTE, CLICKSON_ROUTE, FORMATION_BC_ROUTE]