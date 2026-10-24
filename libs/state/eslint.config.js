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
                '@ngx-formly/builder',
                '@ngx-formly/builder/*',
                '@ngx-formly/builder-material',
                '@ngx-formly/builder-material/*',
                '@ngx-formly/builder-material-fields',
                '@ngx-formly/builder-material-fields/*',
                'primeng',
                'primeng/*',
              ],
              message: 'Keep @ngx-formly/builder-state independent from editor and UI packages.',
            },
          ],
        },
      ],
    },
  },
]);
