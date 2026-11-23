import nextPlugin from '@next/eslint-plugin-next'
import nextParser from 'eslint-config-next/parser'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export const nextConfig = {
  name: 'next',
  files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
  plugins: {
    react,
    'react-hooks': reactHooks,
    import: importPlugin,
    'jsx-a11y': jsxA11y,
    '@next/next': nextPlugin,
  },
  languageOptions: {
    parser: nextParser,
    parserOptions: {
      requireConfigFile: false,
      sourceType: 'module',
      allowImportExportEverywhere: true,
      babelOptions: {
        presets: ['next/babel'],
        caller: { supportsTopLevelAwait: true },
      },
    },
    globals: { ...globals.browser, ...globals.node },
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    ...react.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    'import/no-anonymous-default-export': 'warn',
    'react/no-unknown-property': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
    'react/jsx-no-target-blank': 'off',
  },
}

export const sharedRules = {
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
    'no-undef': 'off',
  },
}
