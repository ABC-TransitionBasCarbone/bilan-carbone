import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(async () => (key: string) => key),
}))
