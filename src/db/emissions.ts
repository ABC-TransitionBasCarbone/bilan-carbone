import { prismaClient } from './client'

export const getAllEmissions = () =>
  prismaClient.emission.findMany({
    select: {
      status: true,
      totalCo2: true,
      quality: true,
      location: true,
      source: true,
      metaData: {
        select: {
          language: true,
          title: true,
          unit: true,
          attribute: true,
          comment: true,
          location: true,
        },
      },
    },
  })
