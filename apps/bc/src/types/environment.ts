import { Environment } from '@abc-transitionbascarbone/db/enums'

export type BCEnvironment = Exclude<Environment, 'MIP'>
