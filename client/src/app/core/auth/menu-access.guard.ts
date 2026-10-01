/**
 * กันไม่ให้เข้าเมนูที่ Role ปัจจุบันไม่มีสิทธิ์ → พากลับหน้า Overview
 */
import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionService } from './session.service';
import { MenuKey } from '../navigation/menu.config';

export function menuAccessGuard(menu: MenuKey): CanMatchFn {
  return () => {
    const session = inject(SessionService);
    return session.canSee(menu) ? true : inject(Router).parseUrl('/overview');
  };
}
