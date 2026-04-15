import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import cypress from 'eslint-plugin-cypress'
import pluginPrettier from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

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
      '@typescript-eslint/no-require-imports': 'off',
      'no-irregular-whitespace': 'off',
      'react/no-unescaped-entities': 'off',
      'react/self-closing-comp': 'error',
      curly: 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/jsx-tag-spacing': [
        'error',
        { beforeSelfClosing: 'always', afterOpening: 'never', beforeClosing: 'never' },
      ],
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.test.*', 'src/tests/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['**/*.test.*', 'src/tests/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
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
