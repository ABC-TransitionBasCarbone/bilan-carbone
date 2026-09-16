import crypto from 'crypto'

export const generateResetToken = () => crypto.randomBytes(32).toString('hex')
