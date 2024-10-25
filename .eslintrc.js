module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'next/core-web-vitals',
    'next/typescript',
  ],
  plugins: ['@typescript-eslint', 'react', 'prettier'],
  rules: {
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
