import nextJest from 'next/jest.js'
import { nextJestBaseConfig } from '../../packages/common/tooling/jest-config/jest.base.ts'

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default nextJest({ dir: './' })(nextJestBaseConfig)
