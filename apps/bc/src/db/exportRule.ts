import { prismaClient } from './client'

export const getExportRules = () => prismaClient.exportRule.findMany()
