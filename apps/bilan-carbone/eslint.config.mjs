import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import cypress from 'eslint-plugin-cypress'
import pluginPrettier from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import { dtsOverride, sharedRules } from '../../eslint.config.base.mjs'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'publicodes-packages/**/publicodes-build/**',
    '**/.env**',
  ]),

  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...sharedRules,
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },

  dtsOverride,

  {
    files: ['**/*.test.*', 'src/tests/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['cypress/**/*.{js,ts,jsx,tsx}'],
    ...cypress.configs.recommended,
  },
])
