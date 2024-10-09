import { prismaClient } from "./client";

export const getAllActualities = () => prismaClient.actuality.findMany();
