import { prismaClient } from "./client.server";


export const updateUserResetTokenForEmail = async (email: string, resetToken: string) =>
  prismaClient.user.update({
    where: { email: email.toLowerCase() },
    data: { resetToken },
  })