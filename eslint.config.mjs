import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**/*', 'migrate-config.js'], 'Ignore dist directory'),
  {
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
]);
