import { Routes } from '@angular/router';
import { AddPackagePage } from './add-package/add-package';
import { ContentEditorPage } from './content-editor/content-editor';
import { ContentApprovalPage } from './content-approval/content-approval';

// เมนู Package (เดิมชื่อ Content selling tools)
// เมนูย่อยเดียว "Add Package" = หน้า Package management (รายการ Content + ปุ่ม + Add) — FD-10
// Content Editor อยู่ใต้ add/ เพื่อให้เมนูย่อย Add Package ยังไฮไลต์
// approval/:code = หน้าตรวจสอบ / อนุมัติ Content (CT-06 · Content Approver)
export const PACKAGE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'add' },
  { path: 'add', component: AddPackagePage, data: { title: 'Add Package' } },
  // แสดง Template เดียวตาม Channel + Product type (FD-12)
  { path: 'add/:code', component: ContentEditorPage, data: { title: 'Add Package' } },
  { path: 'approval/:code', component: ContentApprovalPage, data: { title: 'ตรวจสอบ Content' } },
  // ลิงก์เดิม /package/list → หน้าเดียวกัน
  { path: 'list', pathMatch: 'full', redirectTo: 'add' },
];
