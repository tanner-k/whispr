/* ESLint config for the frontend (React 18 + TypeScript).
 *
 * Self-contained (`root: true`): the repo-root `.eslintrc.json` is not
 * extended here because its shareable configs resolve against the root
 * node_modules, which only carries the git-hook toolchain. ESLint 8 is
 * pinned in package.json (legacy `.eslintrc` format). */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-refresh'],
  env: { browser: true, es2022: true },
  ignorePatterns: ['dist/', 'build/', 'node_modules/', 'coverage/'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // The TS variant supersedes core no-unused-vars for typed code.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', 'src/test/**'],
      env: { node: true },
    },
    {
      files: ['vite.config.ts', '*.cjs'],
      env: { node: true },
    },
  ],
};
