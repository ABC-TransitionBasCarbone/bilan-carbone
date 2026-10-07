import { Environment } from '@abc-transitionbascarbone/common/db/enums'

export type BCEnvironment = Exclude<Environment, 'MIP'>
