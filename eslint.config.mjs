import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig([
  globalIgnores(['dist/**/*', 'migrate-config.js'], 'Ignore dist directory'),

  {
    languageOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-useless-catch': 'warn',
    },
  },
  { files: ['**/*.ts'] },
  { files: ['**/*.ts'], languageOptions: { sourceType: 'commonjs' } },
  {
    files: ['**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.ts'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  tseslint.configs.recommended,

  {
    files: ['**/*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
