import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'warn',
      'no-constant-binary-expression': 'off',
      'no-empty-static-block': 'off',
      'no-new-native-nonconstructor': 'off',
      'no-unused-private-class-members': 'off',
      'no-unused-vars': ['error', {
        caughtErrors: 'none',
      }],
      'semi': ['warn'],
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    files: ['example/src/*', 'test/fixtures/*'],
    languageOptions: {
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off'
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: globals.mocha,
    },
    rules: {
      'no-console': 'off'
    },
  },
]);
