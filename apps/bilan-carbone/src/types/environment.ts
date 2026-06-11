import { Environment } from '@abc-transitionbascarbone/db-common/enums'

export type BCEnvironment = Exclude<Environment, 'MIP'>
