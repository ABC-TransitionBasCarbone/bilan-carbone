import { Environment } from '@prisma/client'

export const hasAccessToEmissionFactor = (environment: Environment) => environment === Environment.BC

export const hasAccessToSettings = (environment: Environment) => environment === Environment.BC

export const hasAccessToActualityCards = (environment: Environment) => environment === Environment.BC
