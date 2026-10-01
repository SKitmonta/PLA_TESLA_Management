import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { TargetSetting } from './target-setting/target-setting';

export const OVERVIEW_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } },
  { path: 'target', component: TargetSetting, data: { title: 'ตั้ง Target' } },
];
