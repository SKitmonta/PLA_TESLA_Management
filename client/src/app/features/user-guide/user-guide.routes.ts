import { Routes } from '@angular/router';
import { GuideManual } from './guide-manual/guide-manual';
import { GuideJourney } from './guide-journey/guide-journey';

// เมนู User guide — ทุก Role เข้าได้
//   manual   คู่มือการใช้งานทีละขั้นตอน (1 2 3 …) พร้อมรูปหน้าจอจริงและคำอธิบาย (?ch=<chapter id>)
//   journey  ภาพรวม User journey ข้าม Role และผลการตรวจสอบระบบ
export const USER_GUIDE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'manual' },
  { path: 'manual', component: GuideManual, data: { title: 'คู่มือการใช้งาน' } },
  { path: 'journey', component: GuideJourney, data: { title: 'User journey' } },
];
