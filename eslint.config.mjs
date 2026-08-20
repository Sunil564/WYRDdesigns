import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      // The verification server builds here, so this fills with generated bundles the
      // moment anyone runs scripts/verify-server.sh. Without it, lint reports several
      // thousand problems in Next's own output and `npm run verify` never gets past it.
      '.next-verify/**',
      'node_modules/**',
      'public/**',
      'build-logs/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The screenshot harness is a development tool and its whole output is a report.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
]

export default config
