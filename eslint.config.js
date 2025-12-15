// eslint.config.js (ESM, ESLint 9+ flat config)
import js from '@eslint/js';
import globals from 'globals';

import gitignore from 'eslint-config-flat-gitignore';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import vuePlugin from 'eslint-plugin-vue';

export default [
  gitignore(),

  // Equivalent of "eslint:recommended"
  js.configs.recommended,

  // Disable formatting-related rules that conflict with Prettier
  prettierConfig,

  // Your project rules
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.es2025,
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      vue: vuePlugin,
    },
    ignores: ['**/*.d.ts', '**/*.map'],
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // Code quality
      'no-console': 'warn',
      'no-debugger': 'error',

      // Enforce ESM (no CommonJS)
      'import/no-commonjs': 'error',

      // Import plugin base rules (equivalent-ish to plugin:import/recommended + errors/warnings)
      ...(importPlugin.configs?.recommended?.rules ?? {}),
      ...(importPlugin.configs?.errors?.rules ?? {}),
      ...(importPlugin.configs?.warnings?.rules ?? {}),

      // Vue recommended rules
      ...(vuePlugin.configs?.recommended?.rules ?? {}),
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
  },
];
