import { Routes } from '@angular/router';
import { MasterMaintenance } from './master-maintenance/master-maintenance';
import { DisplayMapping } from './display-mapping/display-mapping';
import { SyncedMaster } from './synced-master/synced-master';

// หน้ารายการ Package ย้ายไปอยู่เมนู Package › Add Package (26 ก.ย. 2569)
export const MASTER_SETUP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'maintenance' },
  { path: 'maintenance', component: MasterMaintenance, data: { title: 'Master ที่สร้างเอง' } },
  { path: 'display-mapping', component: DisplayMapping, data: { title: 'Mapping ข้อความแสดงผล' } },
  { path: 'synced', component: SyncedMaster, data: { title: 'Master ที่ Sync' } },
];
