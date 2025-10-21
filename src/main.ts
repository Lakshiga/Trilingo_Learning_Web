import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideRouter, withRouterConfig, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService, TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { routes } from './app/app.routes';

// 🔹 Custom Translate Loader
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<TranslationObject>(`/assets/i18n/${lang}.json`);
  }
}

// 🔹 Factory for Translate Loader
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

// 🔹 Bootstrap
bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes, 
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top'
      })
    ),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      fallbackLang: 'en'
    })
  ]
}).catch(err => console.error(err));
