export const sortAlphabetically = (a: string | undefined | null, b: string | undefined | null) =>
  a?.localeCompare(b ?? '') ?? 0

export const computePasswordValidation = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  specialChar: /[!@#$%^&*(),.?":{}|<>-]/.test(password),
  digit: /[0-9]/.test(password),
})
