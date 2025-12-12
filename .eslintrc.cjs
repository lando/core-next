/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    mocha: true,
    es2022: true,
  },
  plugins: ['import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:prettier/recommended',
    'plugin:vue/recommended',
  ],
  rules: {
    // Prettier rules (optional overrides, Prettier is opinionated by default)
    'prettier/prettier': 'error',

    // Code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',

    // enforce esm
    'import/no-commonjs': 'error',

    // TS-specific strictness
    // '@typescript-eslint/no-floating-promises': 'error',
    // '@typescript-eslint/no-misused-promises': 'error',
    // '@typescript-eslint/explicit-function-return-type': 'off', // optional
    // '@typescript-eslint/consistent-type-imports': 'warn',

    // // Optional: strict null rules
    // '@typescript-eslint/strict-boolean-expressions': 'warn',
  },
  settings: {
    'import/resolver': {
      'typescript-bun': {
        project: true,
        alwaysTryTypes: true,
      },
      'exports': true,
      'node': true,
    },
  },
};
