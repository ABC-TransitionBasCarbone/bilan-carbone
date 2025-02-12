import { prismaClient } from '@/db/client'
import { Prisma } from '@prisma/client'

export const createDocument = (document: Prisma.DocumentCreateInput) => prismaClient.document.create({ data: document })

export const deleteDocument = (documentId: string) => prismaClient.document.delete({ where: { id: documentId } })

export const getDocumentById = (documentId: string) => prismaClient.document.findUnique({ where: { id: documentId } })

export const getDocumentsForStudy = (studyId: string) => prismaClient.document.findMany({ where: { studyId } })
