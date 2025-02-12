import { prismaClient } from './client'

export const getExportRules = async () => prismaClient.exportRule.findMany()
