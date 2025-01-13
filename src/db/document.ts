'use server'

import { prismaClient } from '@/db/client'
import { Prisma } from '@prisma/client'

export const createDocument = async (document: Prisma.DocumentCreateInput) =>
  prismaClient.document.create({ data: document })

export const deleteDocument = async (documentId: string) => prismaClient.document.delete({ where: { id: documentId } })

export const getDocumentById = async (documentId: string) =>
  prismaClient.document.findUnique({ where: { id: documentId } })

export const getDocumentsForStudy = async (studyId: string) => prismaClient.document.findMany({ where: { studyId } })
