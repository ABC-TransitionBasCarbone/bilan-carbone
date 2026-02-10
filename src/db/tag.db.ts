'use server'

import { prismaClient } from './client'

export const getStudyTagsFromIds = async (studyId: string, tagIds: string[]) =>
  prismaClient.studyTag.findMany({
    where: { family: { studyId }, id: { in: tagIds } },
    select: { id: true },
  })

export const getStudyTagsByStudyId = async (studyId: string) =>
  prismaClient.studyTag.findMany({
    where: {
      family: {
        studyId,
      },
    },
    include: {
      family: true,
    },
    orderBy: [
      {
        family: {
          name: 'asc',
        },
      },
      {
        name: 'asc',
      },
    ],
  })
