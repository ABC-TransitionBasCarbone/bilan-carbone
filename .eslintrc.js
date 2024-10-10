module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended', // Intègre Prettier dans ESLint
    'next/core-web-vitals',
    'next/typescript',
  ],
  plugins: ['@typescript-eslint', 'react'],
  rules: {
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
