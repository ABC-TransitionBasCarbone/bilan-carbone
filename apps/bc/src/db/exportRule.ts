import { prismaClient } from './client.server'

export const getExportRules = () => prismaClient.exportRule.findMany()
