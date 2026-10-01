/**
 * เมนูหลักใน Sidebar (ตาม Figma Sidebar 1:70) — เพิ่ม/แก้ชื่อเมนูย่อยได้ที่ไฟล์นี้
 * path ต้องตรงกับ app.routes.ts และ features/<menu>/<menu>.routes.ts
 * icon = ชื่อไฟล์ใน client/public/assets/figma/menu-<icon>.svg (และ -active.svg ตอนเลือก)
 */
export type MenuKey = 'overview' | 'package' | 'campaign' | 'seller' | 'master' | 'guide';

export interface SubMenuItem {
  label: string;
  path: string;
  /** ไอคอนหน้าเมนูย่อย — 'add' = เครื่องหมาย + (Figma: + Add Package) · ไม่ระบุ = ใช้ไอคอนของเมนูหลัก */
  icon?: 'add';
}

export interface MenuItem {
  key: MenuKey;
  label: string;
  /** ข้อความตรงกลาง Topbar */
  headerTitle: string;
  path: string;
  icon: 'overview' | 'package' | 'campaign' | 'seller' | 'master' | 'guide';
  children: SubMenuItem[];
}

export const MENU: MenuItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    headerTitle: 'OVERVIEW',
    path: '/overview',
    icon: 'overview',
    children: [
      { label: 'Dashboard', path: '/overview/dashboard' },
      { label: 'ตั้ง Target', path: '/overview/target' },
    ],
  },
  {
    key: 'package',
    label: 'Package',
    headerTitle: 'CONTENT SELLING TOOLS',
    path: '/package',
    icon: 'package',
    children: [
      // Package management กับ Add Package คือหน้าเดียวกัน (FD-10)
      { label: 'Add Package', path: '/package/add', icon: 'add' },
    ],
  },
  {
    key: 'campaign',
    label: 'Campaign',
    headerTitle: 'CAMPAIGN SETUP',
    path: '/campaign',
    icon: 'campaign',
    children: [
      { label: 'Campaign list', path: '/campaign/list' },
      { label: 'Add Campaign', path: '/campaign/new', icon: 'add' },
    ],
  },
  {
    key: 'seller',
    label: 'Seller',
    headerTitle: 'SELLER MANAGEMENT',
    path: '/seller',
    icon: 'seller',
    children: [
      { label: 'Workspace', path: '/seller/workspace' },
      { label: 'Referral links', path: '/seller/referral' },
      { label: 'เครื่องมือ', path: '/seller/tools' },
    ],
  },
  {
    key: 'master',
    label: 'Master setup',
    headerTitle: 'MASTER SETUP',
    path: '/master',
    icon: 'master',
    children: [
      { label: 'Master ที่สร้างเอง', path: '/master/maintenance' },
      { label: 'Mapping ข้อความแสดงผล', path: '/master/display-mapping' },
      { label: 'Master ที่ Sync', path: '/master/synced' },
    ],
  },
  {
    key: 'guide',
    label: 'User guide',
    headerTitle: 'USER GUIDE',
    path: '/guide',
    icon: 'guide',
    children: [
      { label: 'คู่มือการใช้งาน', path: '/guide/manual' },
      { label: 'User journey', path: '/guide/journey' },
    ],
  },
];

export function findMenu(key: MenuKey | undefined): MenuItem | undefined {
  return MENU.find((m) => m.key === key);
}
