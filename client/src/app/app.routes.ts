/**
 * Route หลัก — 1 เมนู = 1 folder ใน features/ (โหลดแบบ Lazy)
 * Route ย่อยของแต่ละเมนูอยู่ใน features/<menu>/<menu>.routes.ts
 */
import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { menuAccessGuard } from './core/auth/menu-access.guard';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        data: { menu: 'overview' },
        canMatch: [menuAccessGuard('overview')],
        loadChildren: () => import('./features/overview/overview.routes').then((m) => m.OVERVIEW_ROUTES),
      },
      {
        path: 'package',
        data: { menu: 'package' },
        canMatch: [menuAccessGuard('package')],
        loadChildren: () => import('./features/package/package.routes').then((m) => m.PACKAGE_ROUTES),
      },
      {
        path: 'campaign',
        data: { menu: 'campaign' },
        canMatch: [menuAccessGuard('campaign')],
        loadChildren: () => import('./features/campaign/campaign.routes').then((m) => m.CAMPAIGN_ROUTES),
      },
      {
        path: 'seller',
        data: { menu: 'seller' },
        canMatch: [menuAccessGuard('seller')],
        loadChildren: () => import('./features/seller/seller.routes').then((m) => m.SELLER_ROUTES),
      },
      {
        path: 'master',
        data: { menu: 'master' },
        canMatch: [menuAccessGuard('master')],
        loadChildren: () => import('./features/master-setup/master-setup.routes').then((m) => m.MASTER_SETUP_ROUTES),
      },
      {
        path: 'guide',
        data: { menu: 'guide' },
        canMatch: [menuAccessGuard('guide')],
        loadChildren: () => import('./features/user-guide/user-guide.routes').then((m) => m.USER_GUIDE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
