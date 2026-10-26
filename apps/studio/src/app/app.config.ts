import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { primengPreset, provideCoreTheme } from '@ngx-formly/builder';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideNzDateFnsAdapter(),
    provideCoreTheme(),
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, primengPreset),
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, zorro-base, bootstrap, zorro-components, primeng',
          },
        },
      },
      inputVariant: 'outlined',
    }),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-symbols-outlined' }, // Set Material Symbols as default
    },
  ],
};
