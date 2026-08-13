import type { TrajectoryWithObjectives } from '@/types/trajectory.types'
import { Prisma, TrajectoryType } from '@abc-transitionbascarbone/db-common'
import { prismaClient } from './client.server'

export const createTrajectoryWithObjectives = async (data: Prisma.TrajectoryCreateInput) => {
  return prismaClient.trajectory.create({
    data,
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const getTrajectoryById = async (id: string): Promise<TrajectoryWithObjectives | null> => {
  return prismaClient.trajectory.findUnique({
    where: { id },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const getTrajectoriesByTransitionPlanId = async (
  transitionPlanId: string,
): Promise<TrajectoryWithObjectives[]> => {
  return prismaClient.trajectory.findMany({
    where: { transitionPlanId },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const hasTrajectory = async (transitionPlanId: string): Promise<boolean> => {
  const count = await prismaClient.trajectory.count({
    where: { transitionPlanId },
  })
  return count > 0
}

export const deleteTrajectory = async (id: string): Promise<void> => {
  await prismaClient.trajectory.delete({
    where: { id },
  })
}

export const updateTrajectoryType = async (
  trajectoryId: string,
  type: TrajectoryType,
  referenceYear: number | null,
  tx: Prisma.TransactionClient,
) => {
  return tx.trajectory.update({
    where: { id: trajectoryId },
    data: { type, referenceYear },
  })
}

export const getOldestPastStudyYear = async (
  transitionPlanId: string,
  tx: Prisma.TransactionClient,
): Promise<number | null> => {
  const [linkedStudies, externalStudies] = await Promise.all([
    tx.transitionPlanStudy.findMany({
      where: { transitionPlanId },
      include: { study: { select: { startDate: true } } },
    }),
    tx.externalStudy.findMany({
      where: { transitionPlanId },
      select: { date: true },
    }),
  ])

  const years = [
    ...linkedStudies.map((s) => s.study.startDate.getFullYear()),
    ...externalStudies.map((s) => s.date.getFullYear()),
  ]

  return years.length > 0 ? Math.min(...years) : null
}

export const getTrajectory = async (trajectoryId: string, tx: Prisma.TransactionClient) => {
  return tx.trajectory.findUnique({
    where: { id: trajectoryId },
    select: { type: true, referenceYear: true },
  })
}
