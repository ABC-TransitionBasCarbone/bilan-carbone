import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import cypress from 'eslint-plugin-cypress'
import mocha from 'eslint-plugin-mocha'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const config = [
  mocha.configs.recommended,
  ...compat.extends(
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:cypress/recommended',
    'next/core-web-vitals',
    'next/typescript',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      prettier,
      cypress,
      mocha,
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'no-irregular-whitespace': 'off',
      'mocha/no-exclusive-tests': 'error',
      'mocha/no-mocha-arrows': 'off',
      'react/no-unescaped-entities': 'off',
      'react/self-closing-comp': 'error',
      curly: 'error',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],

      'react/jsx-tag-spacing': [
        'error',
        {
          beforeSelfClosing: 'always',
          afterOpening: 'never',
          beforeClosing: 'never',
        },
      ],
    },
  },
]

export default config
