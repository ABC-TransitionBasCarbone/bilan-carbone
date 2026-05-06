export const sharedRules = {
  '@typescript-eslint/no-require-imports': 'off',
  'no-irregular-whitespace': 'off',
  'react/no-unescaped-entities': 'off',
  'react/self-closing-comp': 'error',
  curly: 'error',
  'prettier/prettier': ['error', { endOfLine: 'auto' }],
  'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always', afterOpening: 'never', beforeClosing: 'never' }],
}

export const dtsOverride = {
  files: ['**/*.d.ts'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-undef': 'off',
  },
}
