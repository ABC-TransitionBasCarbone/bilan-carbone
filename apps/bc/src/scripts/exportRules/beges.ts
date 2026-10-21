import { prismaClient } from '@/db/client.server'
import { reCreateBegesRules } from '@/db/exports'

reCreateBegesRules(prismaClient)
