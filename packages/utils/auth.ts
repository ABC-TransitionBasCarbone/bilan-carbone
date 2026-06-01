import bcrypt from 'bcryptjs'

export const signPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hashSync(password, salt)
}

export const computePasswordValidation = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  specialChar: /[!@#$%^&*(),.?":{}|<>-]/.test(password),
  digit: /[0-9]/.test(password),
})
