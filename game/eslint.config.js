import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'public/data/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser'],
              message: 'src/logic là logic thuần, không import Phaser (để test được).',
            },
          ],
        },
      ],
    },
  },
  {
    // Chỉ src/logic và src/core bị cấm import Phaser; scene và lớp hiển thị thì được.
    files: ['src/scenes/**/*.ts', 'src/main.ts', 'src/core/phaser-*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
