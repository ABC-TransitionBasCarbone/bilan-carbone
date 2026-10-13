import { Environment } from '@abc-transitionbascarbone/common/db/enums'

const { BC, CUT, TILT, CLICKSON, MIP, COURSE_BC, COURSE_TILT } = Environment
export const courseEnvironments = [COURSE_BC, COURSE_TILT]
export type CourseEnvironment = typeof courseEnvironments[number]

export const advancedEnvironments: Environment[] = [BC, TILT, ...courseEnvironments]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

export const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
export const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)
export const isCourseEnvironment = (environment: Environment): environment is CourseEnvironment =>
  courseEnvironments.includes(environment as CourseEnvironment)

export const fallBackEnvironment = {
  [COURSE_BC]: BC,
  [COURSE_TILT]: TILT,
}

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

export const getEnvironmentHandlingGenericEnvs = <T extends Environment | undefined>(environment: T, availableEnvironments: Environment[] = []): T => {
  let environmentToUse
  if (
    environment &&
    isCourseEnvironment(environment) &&
    !(availableEnvironments as Environment[]).includes(environment)
  ) {
    environmentToUse = fallBackEnvironment[environment as CourseEnvironment] as T
  }

  return environmentToUse ?? environment
}

