module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:cypress/recommended',
    'plugin:mocha/recommended',
    'next/core-web-vitals',
    'next/typescript',
  ],
  plugins: ['@typescript-eslint', 'react', 'prettier', 'cypress', 'mocha'],
  rules: {
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-mocha-arrows': 'off',
    curly: 'error',
    'react/no-unescaped-entities': 'off',
    'react/self-closing-comp': 'error',
    'prettier/prettier': 'error',
    'react/jsx-tag-spacing': [
      'error',
      {
        beforeSelfClosing: 'always',
        afterOpening: 'never',
        beforeClosing: 'never',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
