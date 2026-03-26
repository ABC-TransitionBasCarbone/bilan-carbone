import { prismaClient } from '@/db/client.server'
import { reCreateGHGPRules } from '@/db/exports'

reCreateGHGPRules(prismaClient)
