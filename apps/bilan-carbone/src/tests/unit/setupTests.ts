import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))
