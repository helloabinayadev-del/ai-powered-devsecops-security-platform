import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/test']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // These React Compiler rules flag standard async data-fetch effects in
      // this application, despite their guarded loading state. They are not
      // runtime React warnings and are covered by component tests.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      // Data loaders are intentionally stable within each mounted screen;
      // polling intervals should not be recreated on every render.
      'react-hooks/exhaustive-deps': 'off',
      // Context modules intentionally export their hook alongside Provider.
      'react-refresh/only-export-components': 'off',
      // Incremental API typing is tracked separately; TypeScript build remains
      // the correctness gate while endpoint contracts are consolidated.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
