import js from '@eslint/js';
import globals from 'globals';

// Solo regole di correttezza (js.configs.recommended): lo stile lo decide Prettier.
export default [
  {
    // Cartelle generate e cartelle locali ignorate da git (ESLint non legge .gitignore).
    ignores: [
      'dist/',
      'dist-e2e/',
      'release/',
      'build/',
      'test-results/',
      'playwright-report/',
      'node_modules/',
      '.claude/',
      '.superpowers/',
      'graphify-out/',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        // Definiti da vite.config.js (`define`).
        __APP_VERSION__: 'readonly',
        __RELEASES_URL__: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**', 'tests/**', 'data-sources/**', 'vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
