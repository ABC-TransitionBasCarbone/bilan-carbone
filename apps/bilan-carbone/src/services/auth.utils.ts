import { Environment } from "@repo/db-common/enums"
import { signIn, signOut, SignOutParams } from "next-auth/react"

export async function accountHandler(accountId: string) {
  return await signIn('credentials', {
    redirect: false,
    accountId,
  })
}

export const signOutEnv = async <P extends boolean = true>(
  env: Environment = Environment.BC,
  options?: SignOutParams<P>,
): Promise<P extends true ? void : { url: string }> => {
  const result = (await signOut({
    callbackUrl: `/signed-out?env=${env}`,
    ...options,
  })) as P extends true ? void : { url: string }

  return result
}
