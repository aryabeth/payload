import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from '@payloadcms/eslint-plugin'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
]

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

export const rootParserOptions = {
  sourceType: 'module',
  ecmaVersion: 'latest',
  projectService: {
    allowDefaultProject: ['./src/*.ts', './src/*.tsx'],
    defaultProject: './tsconfig.json',
    maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 40,
  },
}

/** @type {FlatConfig[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [
      ...defaultESLintIgnores,
      'packages/eslint-*/**',
      'test/live-preview/next-app',
      'packages/**/*.spec.ts',
      'templates/**',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
      },
    },
  },
  {
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      'payload/no-imports-from-exports-dir': 'error',
      'payload/no-imports-from-self': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
]

export default [
  ...rootEslintConfig,
  {
    files: ['packages/eslint-config/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['templates/vercel-postgres/**'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
]
