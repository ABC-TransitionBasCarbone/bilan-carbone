import { FlatCompat } from '@eslint/eslintrc'
import pluginPrettier from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

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
    },
  },
])
