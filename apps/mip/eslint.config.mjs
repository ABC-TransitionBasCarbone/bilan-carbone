import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import pluginPrettier from 'eslint-plugin-prettier'
import reactCompiler from 'eslint-plugin-react-compiler'
import { defineConfig, globalIgnores } from 'eslint/config'
import { dtsOverride, sharedRules } from '../../eslint.config.base.mjs'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: {
      prettier: pluginPrettier,
      'react-compiler': reactCompiler,
    },
    rules: sharedRules,
  },
  dtsOverride,
])
