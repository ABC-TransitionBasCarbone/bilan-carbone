import { prismaClient } from './client'

export const createFormation = (name: string, link: string) => prismaClient.formation.create({ data: { name, link } })
export const deleteFormation = (name: string) => prismaClient.formation.delete({ where: { name } })

export const getFormationVideos = () => prismaClient.formation.findMany({ orderBy: { createdAt: 'asc' } })
