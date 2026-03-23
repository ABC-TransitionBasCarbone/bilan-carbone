import type { TrajectoryWithObjectives } from '@/types/trajectory.types'
import { Prisma, TrajectoryType } from '@repo/db-common'
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
  tx: Prisma.TransactionClient,
) => {
  return tx.trajectory.update({
    where: { id: trajectoryId },
    data: { type },
  })
}

export const getTrajectoryType = async (trajectoryId: string, tx: Prisma.TransactionClient) => {
  return tx.trajectory.findUnique({
    where: { id: trajectoryId },
    select: { type: true },
  })
}
