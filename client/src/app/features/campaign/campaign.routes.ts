import { Routes } from '@angular/router';
import { CampaignList } from './campaign-list/campaign-list';
import { CampaignWizard } from './campaign-wizard/campaign-wizard';
import { CampaignDetailPage } from './campaign-detail/campaign-detail';

// เมนู Campaign (doc 06)
//   list          CP-01 รายการ Campaign
//   new           Add Campaign = Wizard 5 ขั้น (CP-02…CP-06)
//   :code         CP-07 รายละเอียด + Grant + อนุมัติ / ตีกลับ / Suspend
//   :code/edit    แก้ไข Campaign สถานะ Draft / ตีกลับ (Wizard)
export const CAMPAIGN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: CampaignList, data: { title: 'Campaign list', crumb: false } },
  { path: 'new', component: CampaignWizard, data: { title: 'Add Campaign' } },
  { path: ':code', component: CampaignDetailPage, data: { title: 'รายละเอียด Campaign' } },
  { path: ':code/edit', component: CampaignWizard, data: { title: 'แก้ไข Campaign' } },
];
