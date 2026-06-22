import { nextJestBaseConfig } from '@abc-transitionbascarbone/jest-config'
import nextJest from 'next/jest.js'

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default nextJest({ dir: './' })(nextJestBaseConfig)
