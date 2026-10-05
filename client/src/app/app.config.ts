import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { actorInterceptor } from './core/auth/actor.interceptor';
import { dataSourceInterceptor } from './core/data-source/data-source.interceptor';
import { TeslaPreset } from './core/theme/tesla-preset';
import { ParamReuseStrategy } from './core/navigation/param-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ใช้ zone.js — PrimeNG 21 บางตัว (Select / DatePicker) ไม่อัปเดตหน้าจอทันทีในโหมด Zoneless
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // เปลี่ยน Parameter (เช่น รหัส Campaign / รหัสกลุ่ม) = สร้างหน้าใหม่
    { provide: RouteReuseStrategy, useClass: ParamReuseStrategy },
    MessageService,
    provideHttpClient(withFetch(), withInterceptors([actorInterceptor, dataSourceInterceptor])),
    // PrimeNG v21 (MIT) — ธีม Aura สีหลักน้ำเงิน Brand · ใช้โหมดสว่างอย่างเดียว
    providePrimeNG({
      theme: { preset: TeslaPreset, options: { darkModeSelector: '.app-dark' } },
      ripple: false,
    }),
  ],
};
