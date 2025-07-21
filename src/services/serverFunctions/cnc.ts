'use server'

import { getCNCs } from '@/db/cnc'

export const getAllCNCs = async () => await getCNCs()
