const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'android/**'],
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'import/no-named-as-default-member': 'off',
      'prettier/prettier': 'error',
    },
  },
];
