import { prismaClient } from '@/db/client'
import { reCreateBegesRules } from '@/db/exports'

reCreateBegesRules(prismaClient)
