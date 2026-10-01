import { Routes } from '@angular/router';
import { WorkspaceList } from './workspace-list/workspace-list';
import { SellerBoard } from './seller-board/seller-board';
import { GroupDetailPage } from './group-detail/group-detail';
import { ReferralList } from './referral-list/referral-list';
import { ReferralDetailPage } from './referral-detail/referral-detail';
import { SellerTools } from './seller-tools/seller-tools';

// เมนู Seller (เดิมชื่อ People management — doc 07 · Figma page 03 People)
//   workspace            P-01 รายการ Workspace
//   workspace/:pkg/:ch   P-02 Board จัดกลุ่ม (Drag & Drop)
//   group/:id            P-03 รายละเอียดกลุ่ม & ผูก Campaign
//   referral(/:code)     P-04 Referral links
//   tools                P-05 คัดลอกกลุ่ม / Import / Export / Audit log
export const SELLER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'workspace' },
  { path: 'workspace', component: WorkspaceList, data: { title: 'Workspace' } },
  { path: 'workspace/:pkg/:ch', component: SellerBoard, data: { title: 'จัดกลุ่มผู้ขาย' } },
  { path: 'group/:id', component: GroupDetailPage, data: { title: 'รายละเอียดกลุ่ม' } },
  { path: 'referral', component: ReferralList, data: { title: 'Referral links' } },
  { path: 'referral/:code', component: ReferralDetailPage, data: { title: 'Referral links' } },
  { path: 'tools', component: SellerTools, data: { title: 'เครื่องมือ' } },
];
