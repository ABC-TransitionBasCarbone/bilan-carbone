import { Environment } from '@abc-transitionbascarbone/db-common/enums'

const { BC, CUT, TILT, CLICKSON, MIP, COURSE_BC, COURSE_TILT } = Environment
export const courseEnvironments = [COURSE_BC, COURSE_TILT] as Environment[]
export const advancedEnvironments: Environment[] = [BC, TILT, ...courseEnvironments]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

export const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
export const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)
export const isCourse = (environment: Environment) => courseEnvironments.includes(environment)


export const environmentWithOnboarding: Environment[] = [BC, CLICKSON]
export const environmentsWithChecklist: Environment[] = [BC]
export const EnvironmentNames = {
  [BC]: 'BC+ 2.0',
  [CUT]: 'Count',
  [TILT]: 'Tilt',
  [CLICKSON]: 'ClicksOn',
  [MIP]: 'Mon Impact Pro',
  [COURSE_BC]: 'BC+ Formation',
  [COURSE_TILT]: 'BC+ Formation TILT',
}

export enum EnvironmentMode {
  SIMPLIFIED = 'SIMPLIFIED',
  ADVANCED = 'ADVANCED',
}

const COUNT_ROUTE = '/count'
const TILT_ROUTE = '/tilt'
const CLICKSON_ROUTE = '/clickson'
const COURSE_BC_ROUTE = '/course-bc'
const COURSE_TILT_ROUTE = '/course-tilt'
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
    case Environment.COURSE_BC:
      base = COURSE_BC_ROUTE
      break
    case Environment.COURSE_TILT:
      base = COURSE_TILT_ROUTE
      break
    default:
      break
  }

  return `${base}/${path}`
}

export const ENV_ROUTES = [COUNT_ROUTE, TILT_ROUTE, CLICKSON_ROUTE, COURSE_BC_ROUTE, COURSE_TILT_ROUTE]