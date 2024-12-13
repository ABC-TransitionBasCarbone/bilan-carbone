'use server'

import { prismaClient } from '@/db/client'
import { Prisma } from '@prisma/client'

export const createDocument = async (document: Prisma.DocumentCreateInput) =>
  prismaClient.document.create({ data: document })

export const getLatestDocumentForStudy = async (studyId: string) =>
  prismaClient.document.findFirst({ where: { studyId }, orderBy: { createdAt: 'desc' } })

export const getDocumentsForStudy = async (studyId: string) => prismaClient.document.findMany({ where: { studyId } })
