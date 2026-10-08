import type { Environment } from '@abc-transitionbascarbone/common/db/enums'

export type BCEnvironment = Exclude<Environment, 'MIP'>
export type CourseEnvironment = Extract<Environment, 'COURSE_BC' | 'COURSE_TILT'>
