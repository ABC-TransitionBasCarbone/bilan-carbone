import { prismaClient } from '@/db/client'
import { reCreateGHGPRules } from '@/db/exports'

reCreateGHGPRules(prismaClient)
