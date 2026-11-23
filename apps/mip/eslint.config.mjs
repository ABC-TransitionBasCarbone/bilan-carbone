import prettier from 'eslint-config-prettier/flat'
import cypress from 'eslint-plugin-cypress'
import pluginPrettier from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import { dtsOverride, nextConfig, sharedRules } from '../../eslint.config.base.mjs'

export default defineConfig([
  nextConfig,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: sharedRules,
  },
  dtsOverride,
  {
    files: ['cypress/**/*.{js,ts,jsx,tsx}'],
    ...cypress.configs.recommended,
  },
])
