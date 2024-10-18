import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// src/app/config.ts
export const API_BASE_URL = 'http://192.168.80.42:3000';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
  
};
