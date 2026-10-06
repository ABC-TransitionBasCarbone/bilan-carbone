import { createHash, randomBytes } from 'node:crypto'

export const generateResetToken = () => randomBytes(32).toString('hex')

export const hashResetToken = (resetToken: string) => createHash('sha256').update(resetToken).digest('hex')
