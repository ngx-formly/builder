// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@angular/cdk',
                '@angular/cdk/*',
                '@angular/material',
                '@angular/material/*',
                '@formly-editor/builder-material',
                '@formly-editor/builder-material/*',
                '@formly-editor/core',
                '@formly-editor/core/*',
                '@formly-editor/material',
                '@formly-editor/material/*',
                'primeng',
                'primeng/*',
              ],
              message: 'Keep @formly-editor/state independent from editor and UI packages.',
            },
          ],
        },
      ],
    },
  },
]);
