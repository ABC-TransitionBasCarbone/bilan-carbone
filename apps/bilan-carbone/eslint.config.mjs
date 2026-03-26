import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import next from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'
import cypress from 'eslint-plugin-cypress'
import mocha from 'eslint-plugin-mocha'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import globals from 'globals'

const config = [
  js.configs.recommended,
  react.configs.flat.recommended,
  ...next,
  prettierConfig,
  {
    plugins: { mocha },
    rules: mocha.configs.recommended.rules,
  },
  {
    plugins: {
      react,
      prettier,
      cypress,
      mocha,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-irregular-whitespace': 'off',
      'mocha/no-exclusive-tests': 'error',
      'mocha/no-mocha-arrows': 'off',
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
    plugins: { cypress },
    languageOptions: {
      globals: {
        ...globals.browser,
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
      },
    },
    rules: {
      ...cypress.configs.recommended.rules,
    },
  },
]

export default config
