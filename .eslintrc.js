module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['@weni/eslint-config/vue3'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/extensions': 'off',
    'no-shadow': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.vue'],
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2020,
    requireConfigFile: false,
    sourceType: 'module',
    babelOptions: {
      presets: ['@babel/preset-env'],
    },
  },
};
